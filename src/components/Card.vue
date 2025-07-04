<script>
export default{
    props:{
        matched:{
            type: Boolean,
            default: false
        },
        position:{
            type: Number,
            required: true
        },
        value: {
        type: Number,
            required: true
        },
    
    visible:{
        type: Boolean,
        default: false
    }
},
    setup(props, context){
        const selectCard = () => {
            context.emit('select-card',{
                position: props.position,
                faceValue: props.value
            })
        }
    return{selectCard}
    }
}
</script>

<template>
    <div class="card" @click="selectCard">
        <div v-if="visible" class="card-face is-front">
            {{ value }} - {{ position }}
        </div>
        <div v-else class="card-face is-back">
            Back
        </div>
    </div>
</template>

<style>

</style>