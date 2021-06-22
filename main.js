// 設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: " FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]
const view = {
  getCardElement(index) {
    return `
    <div data-index="${index}" class="card back"></div>
    `
  },
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `  
      <p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>
    `
  },
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  // indexes 為亂數配置的牌
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  //翻牌函式
  flipCards(...cards) {
    cards.map(card => {
      //如果是背面  回傳正面
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        //綁定在每個卡片上的data-index 可用dataset拿出字串
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      //如果是正面  回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  // 兩張翻牌成功的樣式變化
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  //計分分數
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
  },
  // 計分翻牌次數
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  },
  // 翻牌之後錯誤時的動態影格
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  // 遊戲結束之後時呼叫結束畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

// 洗牌功能Knuth-Shuffle  
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        // 將最後一張  跟中間的隨機一張換牌
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}
//依遊戲狀態來分配動作  所有動作由controller統一發派
const controller = {
  // 初始還沒翻牌的狀態
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  // 依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 判斷成功之後 加分數10分，更改這組資料狀態然後維持翻牌與清空model資料，再把狀態改回FirstCardAwaits
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 判斷為失敗時，將牌翻回去重新翻牌，setTimeout 會停留一秒，清空暫存model,再把狀態改回FirstCardAwaits
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('current state:', this.currentState)
    console.log('revealedCards:', model.revealedCards.map(card => card.dataset.index))
  },
  // 停留一秒一秒的setTimeout 的動作獨立成一個函式來管理
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}
// 集中管理資料
const model = {
  // 暫存牌組
  revealedCards: [],
  //檢查配對成功的函式
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  triedTimes: 0
}
//呼叫所有卡片
controller.generateCards()

// Node List (array-like) 因為是類陣列 所以用forEach  (array才可以用map)
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})