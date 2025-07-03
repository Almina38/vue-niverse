<template>
  <h1>Vue-universe</h1>
  <section class="game-board">
    <Card
    v-for="(card, index) in cardList"
    :key="`card-${index}`"
    :value="card.value" 
    :visible="card.visible"
    :position="card.position"
    @select-card="flipCard"/>
    
  </section>
</template>

<script>
import { ref } from 'vue'
import Card from './components/Card.vue'
export default {
  name: 'App',
  components:{
    Card
  },
  setup(){
    const cardList = ref([])

    for( let i = 0; i < 16; i++){
      cardList.value.push({
        value: i,
        visible: false,
        position: i
      })
    }

    const flipCard = (payload) => {
      cardList.value[payload.position].visible = true
    }
    
    return{
      cardList,
      flipCard
    }
  }
}
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}


.game-board{
  display:grid;
  grid-template-columns: 100px 100px 100px 100px;
  grid-template-rows: 100px 100px 100px 100px;
  grid-column-gap: 30px;
  grid-row-gap: 30px;
  justify-content: center;
}

.card {
  border: 5px solid#ccc;
  position: relative;
}

.card-face{
  width: 100%;
  height: 100%;
  position: absolute;

}
.card-face.is-front{
  background-color: red;
  color: white;
}

.card-face.is-back{
  background-color: blue;
  color: white;
}

</style>
