
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'          //database
import { getAnalytics } from 'firebase/analytics'           //statistiek

const firebaseConfig = {
  apiKey: 'AIzaSyCm8O2YiYOAnNvnKlGk7UM5MDJHNSbK8wU',
  authDomain: 'vue-niverse.firebaseapp.com',
  projectId: 'vue-niverse',
  messagingSenderId: '42953974334',
  appId: '1:42953974334:web:c01c0c2f3e735f48ade76f',
  measurementId: 'G-BZYL96JHH3'
}

const app = initializeApp(firebaseConfig)   
getAnalytics(app)                           

const db = getFirestore(app)               
export { db }
