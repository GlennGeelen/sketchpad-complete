import "phoenix_html"
import {Socket, Presence} from "phoenix"
import {Sketchpad, sanitize} from "./sketchpad"
import socket from "./socket"


socket.connect();

let App = {
  init() {
    this.presences = {}
    this.padChannel = socket.channel("pad:lobby")
    this.el = document.getElementById("sketchpad")
    this.pad = new Sketchpad(this.el, window.userId)
    this.clearButton = document.getElementById("clear-button")
    this.exportButton = document.getElementById("export-button")

    this.userList = document.getElementById("users")

    this.msgInput = document.getElementById("message-input")
    this.msgContainer = document.getElementById("messages")

    this.msgInput.addEventListener("keypress", e => {
      if(e.keyCode !== 13) { return }
      this.msgInput.disable = true

      let onOk = () => {
        this.msgInput.value = ""
        this.msgInput.disable = false
      }

      let onError = () => {
        this.msgInput.disable = false
      }

      this.padChannel.push("new_message", { body: this.msgInput.value })
        .receive("ok", onOk)
        .receive("error", onError)
    })

    this.padChannel.on("png_request", () => {
      this.padChannel.push("png_ack", {png: this.pad.getImageURL()})
        .receive("ok", ({ascii}) => console.log(ascii))
    })

    this.padChannel.on("new_message", ({user_id, body}) => {
      this.msgContainer.innerHTML +=
        `<br><strong>${sanitize(user_id)}:</strong> ${sanitize(body)}`
      this.msgContainer.scrollTop = this.msgContainer.scrollHeight
    })

    this.clearButton.addEventListener("click", e => {
      e.preventDefault()
      this.pad.clear()
      this.padChannel.push("clear")
    })

    this.exportButton.addEventListener("click", e => {
      e.preventDefault()
      window.open(this.pad.getImageURL())
    })

    this.padChannel.on("clear", data => {
      this.pad.clear()
    })

    this.pad.on("stroke", data => {
      this.padChannel.push("stroke", data)
    })

    this.padChannel.on("stroke", ({stroke, user_id}) => {
      this.pad.putStroke(user_id, stroke, {color: "#019283"})
    })

    this.padChannel.join()
      .receive("ok", resp => console.log("join", resp))
      .receive("error", resp => console.log("failed to join", resp))

    this.padChannel.on("presence_state", state => {
      this.presences = Presence.syncState(this.presences, state)
      this.renderUsers()
    })

    this.padChannel.on("presence_diff", diff => {
      this.presences = Presence.syncDiff(this.presences, diff,
        this.onPresenceJoin.bind(this),
        this.onPresenceLeave.bind(this))
      this.renderUsers()
    })

  },

  onPresenceJoin(id, current, newPres) {
    if(!current) {
      console.log(`${id} joined for the first time`)
    } else {
      console.log(`${id} joined from another device`)
    }
  },

  onPresenceLeave(id, current, leftPres) {
    if(current.metas.length === 0) {
      console.log(`${id} left`)
    } else {
      console.log(`${id} closed tab`)
    }
  },

  renderUsers() {
    let listBy = (id, {metas: [first, ...rest]}) => {
      first.count = rest.length + 1
      first.username = id
      return first
    }

    let users = Presence.list(this.presences, listBy)
    this.userList.innerHTML = users.map(user => {
      return `<br/>${sanitize(user.username)} (${user.count})`
    }).join("")
  }
}

App.init()
