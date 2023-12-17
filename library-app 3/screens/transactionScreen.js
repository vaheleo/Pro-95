import React, { Component } from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	ImageBackground,
	Image,
	Alert,
	ToastAndroid,
	KeyboardAvoidingView,
} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import db from '../config';
import {
	collection,
	query,
	where,
	getDocs,
	Timestamp,
	limit,
	addDoc,
	doc,
	updateDoc,
	increment,
} from 'firebase/firestore';


export default class TransactionScreen extends Component {
	constructor(props) {
		super(props);
		this.state = {
			bookId: '',
			memberId: '',
			domState: 'normal',
			hasCameraPermissions: null,
			scanned: false,
			bookName: '',
			memberName: '',
		};
	}

	getCameraPermissions = async (domState) => {
		const { status } = await Permissions.askAsync(Permissions.CAMERA);

		this.setState({

			hasCameraPermissions: status === 'granted',
			domState: domState,
			scanned: false,
		});
	};

	handleBarCodeScanned = async ({ type, data }) => {
		const { domState } = this.state;

		if (domState === 'bookId') {
			this.setState({
				bookId: data,
				domState: 'normal',
				scanned: true,
			});
		} else if (domState === 'memberId') {
			this.setState({
				memberId: data,
				domState: 'normal',
				scanned: true,
			});
		}
	};

	handleTransaction = async () => {
		var { bookId, memberId } = this.state;
		await this.getBookDetails(bookId);
		await this.getMemberDetails(memberId);

		var transactionType = await this.checkBookAvailability(bookId);

		if (!transactionType) {
			this.setState({ bookId: '', memberId: '' });

			Alert.alert("The book doesn't exist in the library database!");
		} else if (transactionType === 'issue') {
			var isEligible = await this.checkMemberEligibilityForBookIssue(
				memberId
			);

			if (isEligible) {
				var { bookName, memberName } = this.state;
				this.initiateBookIssue(bookId, memberId, bookName, memberName);
			}

			Alert.alert('Book issued to the member!');
		} else {
			var isEligible = await this.checkMemberEligibilityForBookReturn(
				bookId,
				memberId
			);

			if (isEligible) {
				var { bookName, memberName } = this.state;
				this.initiateBookReturn(bookId, memberId, bookName, memberName);
			}

			Alert.alert('Book returned to the library!');
		}
	};

	getBookDetails = async (bookId) => {
		bookId = bookId.trim();
		let dbQuery = query(
			collection(db, 'books'),
			where('book_id', '==', bookId)
		);

		let querySnapShot = await getDocs(dbQuery);

		querySnapShot.forEach((doc) => {
			this.setState({
				bookName: doc.data().book_details.book_name,
			});
		});
	};

	getMemberDetails = async (memberId) => {
		memberId = memberId.trim();

		let dbQuery = query(
			collection(db, 'members'),
			where('member_id', '==', memberId)
		);

		let querySnapShot = await getDocs(dbQuery);
		querySnapShot.forEach((doc) => {
			this.setState({
				member_Name: doc.data().member_details.member_name,
			});
		});
	};

	checkBookAvailability = async (bookId) => {
		let dbQuery = query(
			collection(db, 'books'),
			where('book_id', '==', bookId)
		);

		let bookRef = await getDocs(dbQuery);

		var transactionType = '';
		if (bookRef.docs.length == 0) {
			transactionType = false;
		} else {
			bookRef.forEach((doc) => {

				transactionType = doc.data().is_book_available ? 'issue' : 'return';
			});
		}

		return transactionType;
	};

	checkMemberEligibilityForBookIssue = async (memberId) => {
		let dbQuery = query(
			collection(db, 'members'),
			where('member_id', '==', memberId)
		);

		let memberRef = await getDocs(dbQuery);

		var isMemberEligible = '';
		if (memberRef.docs.length == 0) {
			this.setState({
				bookId: '',
				memberId: '',
			});
			isMembertEligible = false;
			Alert.alert("The member id doesn't exist in the database!");
		} else {
			memberRef.forEach((doc) => {
				if (doc.data().number_of_books_issued < 2) {
					isMemberEligible = true;
				} else {
					isMembertEligible = false;
					Alert.alert('The member has already issued 2 books!');
					this.setState({
						bookId: '',
						memberId: '',
					});
				}
			});
		}

		return isMemberEligible;
	};

	checkMemberEligibilityForBookReturn = async (bookId, memberId) => {
		let dbQuery = query(
			collection(db, 'transactions'),
			where('book_id', '==', bookId),
			limit(1)
		);

		let transactionRef = await getDocs(dbQuery);

		var isMemberEligible = '';
		transactionRef.forEach((doc) => {
			var lastBookTransaction = doc.data();
			if (lastBookTransaction.member_id === memberId) {
				isMemberEligible = true;
			} else {
				isMemberEligible = false;
				Alert.alert("The book wasn't issued by this Member!");
				this.setState({
					bookId: '',
					memberId: '',
				});
			}
		});
		return isMemberEligible;
	};

	initiateBookIssue = async (bookId, memberId, bookName, memberName) => {

		const docRef = await addDoc(collection(db, 'transactions'), {
			member_id: memberId,
			member_name: memberName,
			book_id: bookId,
			book_name: bookName,
			date: Timestamp.fromDate(new Date()),
			transaction_type: 'issue',
		});

		const booksRef = doc(db, 'books', bookId);
		await updateDoc(booksRef, {
			is_book_available: false,
		});

	
		const memberRef = doc(db, 'members', memberId);
		await updateDoc(memberRef, {
			number_of_books_issued: increment(1),
		});


		this.setState({
			bookId: '',
			memberId: '',
		});
	};

	initiateBookReturn = async (bookId, memberId, bookName, memberName) => {

		const docRef = await addDoc(collection(db, 'transactions'), {
			member_id: memberId,
			member_name: memberName,
			book_id: bookId,
			book_name: bookName,
			date: Timestamp.fromDate(new Date()),
			transaction_type: 'return',
		});


		const booksRef = doc(db, 'books', bookId);

		await updateDoc(booksRef, {
			is_book_available: true,
		});


		const memberRef = doc(db, 'members', memberId);
		await updateDoc(memberRef, {
			number_of_books_issued: increment(-1),
		});


		this.setState({
			bookId: '',
			memberId: '',
		});
	};

	render() {
		const { bookId, memberId, domState, scanned } = this.state;
		if (domState !== 'normal') {
			return (
				<BarCodeScanner
					onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
					style={StyleSheet.absoluteFillObject}
				/>
			);
		}
		return (
			<KeyboardAvoidingView behavior='padding' style={styles.container}>
				<ImageBackground source={bgImage} style={styles.bgImage}>
					<View style={styles.upperContainer}>
						<Image source={appIcon} style={styles.appIcon} />
						<Image source={appName} style={styles.appName} />
					</View>
					<View style={styles.lowerContainer}>
						<View style={styles.textinputContainer}>
							<TextInput
								style={styles.textinput}
								placeholder={'Book Id'}
								placeholderTextColor={'#FFFFFF'}
								value={bookId}
								onChangeText={(text) => this.setState({ bookId: text })}
							/>
							<TouchableOpacity
								style={styles.scanbutton}
								onPress={() => this.getCameraPermissions('bookId')}>
								<Text style={styles.scanbuttonText}>Scan</Text>
							</TouchableOpacity>
						</View>
						<View style={[styles.textinputContainer, { marginTop: 25 }]}>
							<TextInput
								style={styles.textinput}
								placeholder={'Member Id'}
								placeholderTextColor={'#FFFFFF'}
								value={memberId}
								onChangeText={(text) => this.setState({ memberId: text })}
							/>
							<TouchableOpacity
								style={styles.scanbutton}
								onPress={() => this.getCameraPermissions('memberId')}>
								<Text style={styles.scanbuttonText}>Scan</Text>
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							style={[styles.button, { marginTop: 25 }]}
							onPress={this.handleTransaction}>
							<Text style={styles.buttonText}>Submit</Text>
						</TouchableOpacity>
					</View>
				</ImageBackground>
			</KeyboardAvoidingView>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	bgImage: {
		flex: 1,
		resizeMode: 'cover',
		justifyContent: 'center',
	},
	upperContainer: {
		flex: 0.5,
		justifyContent: 'center',
		alignItems: 'center',
	},
	appIcon: {
		width: 200,
		height: 200,
		resizeMode: 'contain',
		marginTop: 80,
	},
	appName: {
		width: 80,
		height: 80,
		resizeMode: 'contain',
	},
	lowerContainer: {
		flex: 0.5,
		alignItems: 'center',
	},
	textinputContainer: {
		borderWidth: 2,
		borderRadius: 10,
		flexDirection: 'row',
		backgroundColor: '#9DFD24',
		borderColor: '#FFFFFF',
	},
	textinput: {
		width: '57%',
		height: 50,
		padding: 10,
		borderColor: '#FFFFFF',
		borderRadius: 10,
		borderWidth: 3,
		fontSize: 18,
		backgroundColor: '#5653D4',
		fontFamily: 'Rajdhani_600SemiBold',
		color: '#FFFFFF',
	},
	scanbutton: {
		width: 100,
		height: 50,
		backgroundColor: '#9DFD24',
		borderTopRightRadius: 10,
		borderBottomRightRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scanbuttonText: {
		fontSize: 24,
		color: '#0A0101',
		fontFamily: 'Rajdhani_600SemiBold',
	},
	button: {
		width: '43%',
		height: 55,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F48D20',
		borderRadius: 15,
	},
	buttonText: {
		fontSize: 24,
		color: '#FFFFFF',
		fontFamily: 'Rajdhani_600SemiBold',
	},
});