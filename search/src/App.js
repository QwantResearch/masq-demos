import React, { Component } from 'react'
import './App.css'

import SearchBar from './components/SearchBar'

import { Client } from 'masq-client'

function ConnectionStatus ({ isConnected }) {
  return isConnected
    ? <p style={{ color: 'green' }}>Connected to Masq</p>
    : <p style={{ color: 'red' }}>Disconnected from Masq</p>
}

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      items: [],
      isConnected: false
    }
    this.client = null
    this.onSearch = this.onSearch.bind(this)
  }

  async onSearch (query) {
    console.log('query:', query)
    let occurences = (await this.client.getItem(query)) || 0
    await this.client.setItem(query, occurences + 1)

    if (occurences > 0) return
    let items = this.state.items.slice()
    items.push(query)
    this.setState({
      items: items
    })
  }

  async componentDidMount () {
    const appInfo = {
      url: 'https://masq.io/search',
      name: 'Masq Search',
      description: 'Simple search engine using qwant.com'
    }
    const settings = {
      socketUrl: 'ws://localhost:8080',
      socketConf: { requestTimeout: 0 }
    }

    try {
      this.client = new Client(settings)

      this.client.onSignIn(function (userId) {
        console.log('onSignIn', userId)
      })
      // Register an events to be notifed when users sign out of Masq
      this.client.onSignOut(function () {
        console.log('onSignOut')
      })

      await this.client.init(appInfo)

      this.setState({ isConnected: true })

      this.client.ws.onopen(() => {
        this.setState({ isConnected: true })
      })
      this.client.ws.onreopen(() => {
        this.setState({ isConnected: true })
      })
      this.client.ws.onclose(() => {
        this.setState({ isConnected: false })
      })

      // Get Search history
      const keys = (await this.client.listKeys())
      this.setState({
        items: keys
      })

      console.log('keys:', keys)
    } catch (err) {
      if (err.status === 403) {
        window.localStorage.removeItem('token')
      }
      console.error(err)
    }
  }

  render () {
    const { isConnected } = this.state
    return (
      <div className='App'>
        <ConnectionStatus isConnected={isConnected} />
        <SearchBar onSearch={this.onSearch} items={this.state.items} />
      </div>
    )
  }
}

export default App
