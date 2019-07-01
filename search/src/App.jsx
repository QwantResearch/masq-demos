import React, { Component } from 'react'
import * as createMasq from 'masq-lib'

import SearchBar from './components/SearchBar'

import './App.css'

const APP = {
  name: 'Qwant Search',
  description: 'Qwant Search app integrated with Masq',
  image: 'https://qwant.com/img/v4/home-banner.svg?1542966874062',
  imageURL: 'https://fr.wikipedia.org/wiki/Qwant#/media/File:Qwant_new_logo_2018.svg'
}

// function ConnectionStatus ({ isConnected }) {
//   return isConnected
//     ? <p style={{ color: 'green' }}>Connected to Masq</p>
//     : <p style={{ color: 'red' }}>Disconnected from Masq</p>
// }

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      items: [],
      loggedIn: null,
      err: null,
      link: '#',
      loggingIn: false,
      stayConnected: false
    }

    this.masq = null
    this.onSearch = this.onSearch.bind(this)
    this.handleClickLogin = this.handleClickLogin.bind(this)
    this.handleClickLogout = this.handleClickLogout.bind(this)
    this.getAllQueriesFromDB = this.getAllQueriesFromDB.bind(this)
    this.handleStayConnectedChange = this.handleStayConnectedChange.bind(this)
  }

  async getAllQueriesFromDB () {
    // Retrieve existing keys, in order to
    // retrieve items from the values stored in the DB
    const itemsObj = await this.masq.list()
    const queryList = Object.keys(itemsObj)
    this.setState({ items: queryList })
  }

  async componentDidMount () {

    try {
      this.masq = await createMasq(APP.name, APP.description, APP.imageURL)
      if (this.masq.isLoggedIn()) {
        this.setState({ loggedIn: true })
        await this.getAllQueriesFromDB()
      } else {
        const link = await this.masq.getLoginLink()
        this.setState({
          link,
          loggedIn: false
        })
      }
    } catch (err) {
      this.setState({ err })
    }
  }

  async onSearch (query) {
    if (!this.state.loggedIn) {
      return
    }

    // return if the query is already in the history
    if (this.state.items.find(i => i === query)) {
      const nb = await this.masq.get(query)
      await this.masq.put(query, nb + 1)
      return
    }

    const items = [...this.state.items, query]
    try {
      // We create one key in DB per search item instead
      // of updating an array
      await this.masq.put(query, 1)
      this.setState({ items })
    } catch (e) {
      console.error(e.message)
    }
  }

  async handleClickLogin () {
    if (!this.state.link) {
      return
    }

    this.setState({ loggingIn: true })
    try {
      await this.masq.logIntoMasq(this.state.stayConnected)
      this.setState({ loggedIn: true })
      await this.getAllQueriesFromDB()
    } catch (e) {
      console.error(e)
    }
    this.setState({ loggingIn: false })
  }

  async handleClickLogout () {
    const link = await this.masq.getLoginLink()

    this.setState({
      link,
      loggedIn: false,
      items: []
    })

    await this.masq.signout()
  }

  async handleStayConnectedChange (event) {
    const target = event.target
    const stayConnected = target.checked
    this.setState({ stayConnected })
  }

  render () {
    const { items, loggedIn, link, loggingIn } = this.state
    return (
      <div className='App'>
        {loggedIn === null && !loggingIn && <div href='#'>Loading</div>}
        {loggedIn === false && !loggingIn && (
          <div className='Login'>
            <div className='stayConnected'>
              <input
                name="stayConnected"
                type="checkbox"
                checked={this.state.stayConnected}
                onChange={this.handleStayConnectedChange} />
              <label htmlFor='stayConnected'>stay connected</label>
            </div>
            <a
              href={link}
              target='_blank'
              rel="noopener noreferrer"
              onClick={this.handleClickLogin}
            >Log Into Masq
            </a>
          </div>
        )}
        {loggedIn && !loggingIn && <a href='#' onClick={this.handleClickLogout}>Logout</a>}
        {loggingIn && <div>Logging In</div>}
        <SearchBar onSearch={this.onSearch} items={items} />
      </div>
    )
  }
}

export default App
