<template>
  <div class="card" @click="selectCard">
    <div class="card-inner" :class="flippedStyles">
      <div class="card-face is-front">
        <img
          :src="`/images/${value}.png`"
          :alt="value"
          class="card-image"
        />
        <img
          v-if="matched"
          src="/images/checkmark.svg"
          alt="Checkmark"
          class="icon-checkmark"
        />
      </div>
      <div class="card-face is-back"></div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  props: {
    matched: {
      type: Boolean,
      default: false
    },
    position: {
      type: Number,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  setup(props, context) {
    const flippedStyles = computed(() => (props.visible ? 'is-flipped' : ''))

    const selectCard = () => {
      context.emit('select-card', {
        position: props.position,
        faceValue: props.value
      })
    }

    return {
      flippedStyles,
      selectCard
    }
  }
}
</script>

<style scoped>
.card {
  width: 110px;
  height: 110px;
  cursor: pointer;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.5s ease-in-out;
  transform-style: preserve-3d;
}

.card-inner.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 10px;
  backface-visibility: hidden;
  top: 0;
  left: 0;
}

.card-face.is-front {
  background-image: url('../../public/images/card-bg-empty.png');
  background-position: center;
  background-size: cover;
  transform: rotateY(180deg);
}

.card-face.is-back {
  background-image: url('../../public/images/card-bg.png');
  background-position: center;
  background-size: cover;
  transform: rotateY(0deg);
}

.card-image {
  width: 70%;
  height: 70%;
  margin: 15%;
  object-fit: contain;
}

.icon-checkmark {
  position: absolute;
  width: 20%;
  right: 5px;
  bottom: 5px;
}

/* Responsive */
@media (max-width: 768px) {
  .card {
    width: 90px;
    height: 90px;
  }
}

@media (max-width: 480px) {
  .card {
    width: 80px;
    height: 80px;
  }

  .icon-checkmark {
    width: 18%;
  }
}

</style>
