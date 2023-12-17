import { initializeApp } from "firestore/app"


const firebaseConfig = {
  apiKey: "AIzaSyCSbL0SyXxtaLM0Z8eA1fiEYKyoK_E3A1A",
  authDomain: "library-app-33add.firebaseapp.com",
  databaseURL: "https://library-app-33add-default-rtdb.firebaseio.com",
  projectId: "library-app-33add",
  storageBucket: "library-app-33add.appspot.com",
  messagingSenderId: "89017456050",
  appId: "1:89017456050:web:2e2d68e4bbacc2dbd040ab",
  measurementId: "G-T2S20FD3XP"
};

firebase.initializeApp(firebaseConfig);

export default firebase();

