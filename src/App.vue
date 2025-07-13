<template>
  <h1 class="sr-only">Vue-niverse</h1>
  <img src="/images/title.png" 
    alt="Vue-niverse" class="title"
    :style="{ width: '500px', height: 'auto' }" />
  <section class="description">
    <p>Welcome to Vue-niverse,</p>
    <p>A card matching game powered by Vue.js 3!</p>
  </section>

  <!-- Hier wordt de hele kaartlijst getoond.
    Elke kaart komt uit 'cardList' en heeft een unieke waarde.
    matched = of het een paar is, visible = open of dicht, position = locatie op bord.
    Bij klikken op een kaart roepen we flipCard aan.-->  
  <transition-group tag="section" 
    class="game-board" name="shuffle-card">
    <Card
      v-for="card in cardList"
      :key="`${card.value}-${card.variant}`" 
      :matched="card.matched"
      :value="card.value" 
      :visible="card.visible"
      :position="card.position"
      @select-card="flipCard"/>
  </transition-group>

  <h2 class="status">{{ status }}</h2>
  <h3 class="score">Score: {{ score }}</h3>
  
  <!-- buttons die veranderen-->
  <button v-if="newPlayer" @click="startGame" class="button">
    <img src="../public/images/play.svg" alt="Restart Icoon">
    Start game 
  </button>

  <button v-else @click="restartGame" class="button">
    <img src="../public/images/restart.svg" alt="Restart Icoon">
    Restart game
  </button>

  <!-- Highscores panel rechts -->
  <aside v-if="showHighscorePanel" class="highscore-panel">
    <h3>Highscores</h3>
    <ol>
      <li v-for="(entry, i) in highscoreList" :key="i">
        {{ entry.name }} - {{ entry.score }}
      </li>
    </ol>
  </aside>

  <!-- Naam-popup bij binnenkomst -->
  <div v-if="showNamePopup" class="name-popup-backdrop">
    <div class="name-popup">
      <h2>Enter your name for Highscores</h2>
      <input type="text" v-model="playerName" placeholder="Your name" @keyup.enter="confirmName" />
      <div class="popup-buttons">
        <button :disabled="!playerName.trim()" @click="confirmName" class="button">Confirm</button>
        <button @click="skipName" class="button">Skip</button>
      </div>
    </div>
  </div>

</template>

<script>
import _ from 'lodash'
import { computed, ref, watch, onMounted } from 'vue'
import { launchConfetti } from './utilities/confetti'
import Card from './components/Card.vue'
import { db } from '../firebase'
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'

export default {
  name: 'App',
  components: {
    Card
  },
  setup() {
    const cardList = ref([]) //de lijst met alle kaarten
    const userSelection = ref([]) //de geselecteerde kaarten (max 2)
    const newPlayer = ref(true) //true = nog niet begonnen
    const lockBoard = ref(false) //blokkeert input als er 2 kaarten open zijn
    const score = ref(0) //de score van de speler

    // Highscore & spelernaam
    const highscoreList = ref([])
    const playerName = ref('')

    // Popup controls
    const showNamePopup = ref(true) // popup bij binnenkomst tonen
    const showHighscorePanel = ref(false) // highscore panel rechts zichtbaar

    // Laad highscores van Firestore
    async function fetchHighscores() {
      const q = query(collection(db, 'highscores'), orderBy('score', 'desc'), limit(5))
      const querySnapshot = await getDocs(q)
      highscoreList.value = []
      querySnapshot.forEach(doc => {
        highscoreList.value.push(doc.data())
      })
    }

    onMounted(fetchHighscores)

    // Begin spel functie blijft ongewijzigd
    const startGame = () => {
      newPlayer.value = false //spel gestart
      restartGame() //start meteen het spel
      showHighscorePanel.value = !!playerName.value.trim() //toon highscore panel alleen als naam ingevuld
      showNamePopup.value = false //popup weg
    }

    //status geeft tekst weer hoeveel paren nog over zijn of dat speler wint
    const status = computed(() => {
      if (remainingPairs.value === 0) {
        return 'Player wins!'
      } else {
        return `Remaining Pairs: ${remainingPairs.value}`
      }
    })

    //hoeveel paren zijn er nog niet gevonden
    const remainingPairs = computed(() => {
      const remainingCards = cardList.value.filter(card => !card.matched).length
      return remainingCards / 2
    })

    //reset en schud kaarten opnieuw, beginstand
    const restartGame = () => {
      cardList.value = _.shuffle(cardList.value)

      cardList.value = cardList.value.map((card, index) => {
        return {
          ...card,
          matched: false, //nog geen paar gevonden
          position: index, //zet de positie
          visible: false //kaart weer dicht
        }
      })

      userSelection.value = [] //selectie resetten
      score.value = 0 //score resetten
      lockBoard.value = false //board ontgrendelen
    }

    //namen van kaarten
    const cardItems = ['alien', 
    'saturn', 'astronaut', 'blackhole', 'comet', 'rocket', 'asteroid', 'sun']

    //zet kaartlijst in het begin klaar met 8 paren, 2 varianten per paar
    if (cardList.value.length === 0) {
      cardItems.forEach(item => {
        cardList.value.push({
          value: item,
          variant: 1,
          visible: false, //kaart dicht
          position: null,
          matched: false
        })
        cardList.value.push({
          value: item,
          variant: 2,
          visible: true, //kaart open (voor presentatie)
          position: null,
          matched: false
        })
      })

      //zet posities na toevoegen
      cardList.value = cardList.value.map((card, index) => {
        return {
          ...card,
          position: index
        }
      })
    }

    //kaart omdraaien bij klikken
    const flipCard = (payload) => {
      if (lockBoard.value) return //als board locked is niet klikken
      const selectedCard = cardList.value[payload.position]

      if (selectedCard.matched || selectedCard.visible) return //kaart al open of matched negeren

      selectedCard.visible = true //kaart laten zien

      if (userSelection.value[0]) {
        //al 1 kaart geselecteerd
        if (
          userSelection.value[0].position === payload.position &&
          userSelection.value[0].faceValue === payload.faceValue
        ) {
          return //dubbel klikken op dezelfde kaart negeren
        } else {
          userSelection.value[1] = payload //tweede kaart geselecteerd
        }
      } else {
        userSelection.value[0] = payload //eerste kaart geselecteerd
      }
    }

    //kijk of er geen paren meer zijn, dan confetti en highscore opslaan
    watch(remainingPairs, async (currentValue) => {
      if (currentValue === 0) {
        launchConfetti() //confetti bij winnen

        if (playerName.value.trim() && score.value > 0) {
          await addHighscore(playerName.value.trim(), score.value) //voeg toe aan highscore lijst
          await fetchHighscores() //vernieuw lijst
          showHighscorePanel.value = true //toon lijst
        }
      }
    })

    //als er 2 kaarten open zijn controleer of match of niet
    watch(userSelection, (currentValue) => {
      if (currentValue.length === 2) {
        const cardOne = currentValue[0]
        const cardTwo = currentValue[1]

        lockBoard.value = true //blokkeer bord tijdens controle

        if (cardOne.faceValue === cardTwo.faceValue) {
          cardList.value[cardOne.position].matched = true //kaart 1 matched
          cardList.value[cardTwo.position].matched = true //kaart 2 matched
          score.value += 10 //punten erbij
          lockBoard.value = false //ontgrendel bord
        } else {
          score.value = Math.max(0, score.value - 2) //punten eraf, niet onder 0
          setTimeout(() => {
            //kaart weer dicht
            cardList.value[cardOne.position].visible = false
            cardList.value[cardTwo.position].visible = false
            lockBoard.value = false
          }, 1300) //wachttijd flip
        }

        userSelection.value.length = 0 //reset selectie
      }
    }, { deep: true })

    //highscore toevoegen aan firestore
    async function addHighscore(name, score) {
      await addDoc(collection(db, 'highscores'), {
        name,
        score
      })
    }

    //naam bevestigen bij popup
    function confirmName() {
      if (!playerName.value.trim()) return //niet bevestigen als leeg
      showNamePopup.value = false //popup weg
      showHighscorePanel.value = true //toon lijst
    }

    //popup overslaan zonder naam
    function skipName() {
      playerName.value = '' //naam leeg maken
      showNamePopup.value = false //popup weg
      showHighscorePanel.value = false //geen lijst tonen
    }

    return {
      cardList,
      flipCard,
      userSelection,
      status,
      restartGame,
      startGame,
      newPlayer,
      score,

      highscoreList,
      playerName,
      showNamePopup,
      showHighscorePanel,

      confirmName,
      skipName,
    }
  }
}
</script>


<style>
html, body {
  margin: 0;
  padding: 0;
}

h1 {
  margin-top: 0;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;

  background-image: url('../public/images/page-bg.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 80%;

  background-color: rgb(0, 0, 0);
  min-height: 100vh;
  color: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
  padding-top: 5px;
}

.description {
  font-family: "Titillium Web", sans-serif;
  font-weight: 600;
  font-style: normal;
}

.description p {
  margin: 0;
  font-size: 0.9rem;
}

.description p:last-child {
  margin-bottom: 20px;
}

.status {
  font-family: "Titillium Web", sans-serif;
  font-weight: 300;
  font-size: 1.1rem;
  margin-bottom: 0px;
}

.score {
  font-family: "Titillium Web", sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 10px;
  margin-top: 0px;
}

.button {
  background-color: #0093A9;
  color: white;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-weight: bold;
  font-family: "Titillium Web", sans-serif;
  font-size: 1rem;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
}

.button img {
  padding-right: 5px;
  width: 20px;
  height: 20px;
}

.game-board {
  display: grid;
  grid-template-columns: repeat(4, 110px);
  grid-template-rows: repeat(4, 110px);
  grid-column-gap: 14px;
  grid-row-gap: 14px;
  justify-content: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}

.title {
  padding-bottom: 10px;
  padding-top: 0px;
  width: 100%;
  max-width: 550px;
  height: auto;
}

.shuffle-card-move {
  transition: transform 0.8s ease-in;
}

.highscore-panel {
  position: fixed;
  top: 80px;
  right: 10px;
  width: 170px; 
  max-height: 60vh;
  overflow-y: auto;
  background: rgba(0,0,0,0.8);
  border: 2px solid #0093A9;
  border-radius: 10px;
  padding: 15px;
  color: #FFD700;
  font-family: "Titillium Web", sans-serif;
  z-index: 1000;
}

.highscore-panel h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.highscore-panel ol {
  padding-left: 20px;
  margin: 0;
}

.highscore-panel li {
  margin-bottom: 5px;
  text-transform: uppercase; /* namen in hoofdletters */
}

.name-popup-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.85);
  display: flex;
  justify-content: center; 
  align-items: center;    
  z-index: 2000;
}

.name-popup {
  background: #000;
  padding: 20px 25px;
  border-radius: 12px;
  max-width: 320px;
  width: 90vw;
  text-align: center;
  color: white;
  font-family: "Titillium Web", sans-serif;
  box-shadow: 0 0 20px #0093A9;
  font-size: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.name-popup input {
  width: 100%;
  font-size: 1rem;
  padding: 10px;
  border-radius: 10px;
  border: none;
  margin: 0;
  text-align: center;
  box-sizing: border-box;
  max-width: 300px;
}

.popup-buttons {
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 300px;
  gap: 10px;
}

.popup-buttons .button {
  width: 45%;
  padding: 0.5rem 0;
}

@media (max-width: 768px) {
  #app {
    background-size: 90%;
  }

  .game-board {
    grid-template-columns: repeat(4, 90px);
    grid-template-rows: repeat(4, 90px);
    grid-gap: 15px;
  }

  .title {
    max-width: 450px;
  }

  .button {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  .status {
    font-size: 1rem;
  }

  .score {
    font-size: 1rem;
  }

  .highscore-panel {
    position: static;
    width: auto;
    max-height: none;
    margin-top: 15px;
    border: 2px solid #0093A9;
  }
}

@media (max-width: 480px) {
  #app {
    background-size: 90%;
  }

  .game-board {
    grid-template-columns: repeat(4, 80px);
    grid-template-rows: repeat(4, 80px);
    grid-gap: 10px;
  }

  .description p {
    font-size: 0.85rem;
  }

  .status {
    font-size: 0.9rem;
  }
  
  .score {
    font-size: 0.9rem;
  }

  .button {
    font-size: 0.85rem;
    padding: 0.3rem 0.6rem;
  }

  .title {
    max-width: 300px;
  }

  .name-popup {
    max-width: 260px;
    padding: 15px 20px;
  }

  .name-popup input {
    font-size: 0.9rem;
    max-width: 240px;
    padding: 8px;
  }

  .popup-buttons .button {
    padding: 0.4rem 0;
    font-size: 0.9rem;
  }
}

</style>
