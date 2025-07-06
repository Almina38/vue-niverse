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
  Bij klikken op een kaart roepen we flipCard aan.-->  <transition-group tag="section" 
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
</template>
<script>
import _ from 'lodash'
import { computed, ref, watch } from 'vue'
import { launchConfetti } from './utilities/confetti'
import Card from './components/Card.vue'

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

    const startGame = () => {
      newPlayer.value = false //spel gestart
      restartGame() //start meteen het spel
    }

    const status = computed(() => {
      //tekst die laat zien of je nog bezig bent of hebt gewonnen
      if (remainingPairs.value === 0) {
        return 'Player wins!'
      } else {
        return `Remaining Pairs: ${remainingPairs.value}`
      }
    })

    const remainingPairs = computed(() => {
      //tel hoeveel kaarten nog niet matched zijn, deel door 2 = aantal paren
      const remainingCards = cardList.value.filter(
        card => card.matched === false
      ).length
      return remainingCards / 2
    })

    const restartGame = () => {
      //shuffle de kaarten opnieuw en zet alles terug naar begin
      cardList.value = _.shuffle(cardList.value)

      cardList.value = cardList.value.map((card, index) => {
        return {
          ...card,
          matched: false, //geen kaarten matched bij begin
          position: index,
          visible: false //alle kaarten omgedraaid
        }
      })

      userSelection.value = [] //selecties resetten
      score.value = 0 //score resetten
    }

    //set kaarten met 8 paren (16 kaarten)
    const cardItems = ['alien', 'saturn', 'astronaut', 'blackhole', 'comet', 
      'rocket', 'asteroid', 'sun']

    // elke kaart 2x in de lijst met een variant erbij
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
        visible: true, //2e kaart van set open voor presentatie
        position: null,
        matched: false
      })
    })

    //stel de positie in (na toevoegen)
    cardList.value = cardList.value.map((card, index) => {
      return {
        ...card,
        position: index
      }
    })

    const flipCard = (payload) => {
      if (lockBoard.value) return //voorkomt klikken tijdens animatie
      const selectedCard = cardList.value[payload.position]

      if (selectedCard.matched || selectedCard.visible) return //al matched of open? negeren

      selectedCard.visible = true //laat kaart zien

      if (userSelection.value[0]) {
        //als al 1 kaart geselecteerd is
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

    watch(remainingPairs, currentValue => {
      if (currentValue === 0) {
        launchConfetti() //confetti als user wint
      }
    })

    watch(userSelection, currentValue => {
      if (currentValue.length === 2) {
        const cardOne = currentValue[0]
        const cardTwo = currentValue[1]

        lockBoard.value = true //blokkeer verder klikken

        if (cardOne.faceValue === cardTwo.faceValue) {
          //match gevonden
          cardList.value[cardOne.position].matched = true
          cardList.value[cardTwo.position].matched = true
          score.value += 10 //punten erbij
          lockBoard.value = false //opnieuw klikken mag
        } else {
          score.value = Math.max(0, score.value - 2) //punten eraf, maar niet onder 0
          setTimeout(() => {
            //kaarten weer verbergen
            cardList.value[cardOne.position].visible = false
            cardList.value[cardTwo.position].visible = false
            lockBoard.value = false
          }, 1300) //wachttijd flip
        }

        userSelection.value.length = 0 //reset selectie
      }
    }, { deep: true })

    return {
      cardList,
      flipCard,
      userSelection,
      status,
      restartGame,
      startGame,
      newPlayer,
      score
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

  .score{
    font-size: 1rem;
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
  
  .score{
    font-size: 0.9rem;
  }

  .button {
    font-size: 0.85rem;
    padding: 0.3rem 0.6rem;
  }

  .title {
    max-width: 300px;
  }
}
</style>
