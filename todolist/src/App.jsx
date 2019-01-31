import React, { Component } from 'react'
import Masq from 'masq-lib'

import Item from './components/Item'

import './App.css'

const APP = {
  name: 'Qwant Tasks',
  description: 'Organize your tasks',
  imageURL: ''
}

class App extends Component {
  constructor (props) {
    super(props)
    this.masq = null
    this.state = { items: {}, item: '', link: null, logged: false }
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleClickLogout = this.handleClickLogout.bind(this)
    this.handleClickTrash = this.handleClickTrash.bind(this)
    this.handleClickConnect = this.handleClickConnect.bind(this)
    this.fetchTasksFromDB = this.fetchTasksFromDB.bind(this)
    this.handleChangeChecked = this.handleChangeChecked.bind(this)
  }

  async componentDidMount () {
    this.masq = new Masq(APP.name, APP.description, APP.imageURL)

    if (this.masq.isLoggedIn()) {
      await this.masq.connectToMasq()
      this.setState({ logged: true })
      await this.fetchTasksFromDB()
    } else {
      const link = await this.masq.getLoginLink()
      this.setState({ link, logged: false })
    }
  }

  async fetchTasksFromDB () {
    const items = await this.masq.list()
    this.setState({ items })
  }

  handleChange (event) {
    this.setState({ item: event.target.value })
  }

  async handleSubmit (event) {
    event.preventDefault()
    const { item, items } = this.state

    if (!this.state.item.length) return // text is empty
    if (items[item] !== undefined) return

    await this.masq.put(`/${item}`, false)

    this.setState({
      item: '',
      items: { ...items, [item]: false }
    })
  }

  async handleClickConnect () {
    const { link } = this.state
    if (!link) return
    window.open(link, '_blank')
    for (let i = 0; i < 3; i++) {
      try {
        await this.masq.logIntoMasq(this.state.stayConnected)
        // if no error catched but initial step not passed, try again
        if (this.initialStepPassed) {
          this.setState({ logged: true })
          await this.fetchTasksFromDB()
          break
        }
      } catch (error) {
        // if error try again
        console.log('catch it', error.type)
        if (error.type === 'Masq access refused by the user') { break }
      }
    }
    console.log('outisde for')
  }

  async handleClickLogout () {
    await this.masq.signout()
    const link = await this.masq.getLoginLink()
    this.setState({ logged: false, link, items: {}, item: '' })
  }

  handleChangeChecked (item) {
    const isChecked = !this.state.items[item]
    this.setState({
      items: { ...this.state.items, [item]: isChecked }
    })
    this.masq.put(`/${item}`, isChecked)
  }

  handleClickTrash (item) {
    const items = Object.assign({}, this.state.items)
    delete items[item]

    this.setState({ items })
    this.masq.del(`/${item}`)
  }

  renderConnectButton () {
    const { logged } = this.state
    const label = logged ? 'Logout from Masq' : 'Connect with Masq'
    const action = logged ? this.handleClickLogout : this.handleClickConnect

    return (
      <button
        className='connectButton uk-button uk-button-secondary uk-margin'
        onClick={action}
      >{label}</button>
    )
  }

  renderConnectionStatus () {
    const currentUserInfo = JSON.parse(window.sessionStorage.getItem('currentUserInfo'))
    const label = this.state.logged ? `You are connected ${currentUserInfo.username}` : 'Not connected'
    const status = this.state.logged ? 'success' : 'warning'
    return (
      <div><span className={`uk-label uk-label-${status}`}>{label}</span></div>
    )
  }

  render () {
    const { item, items, logged } = this.state

    return (
      <div className='App'>
        <nav className='uk-navbar-container'>
          <div className='uk-navbar-left uk-margin'>
            <a className='uk-navbar-item uk-logo' href='/'>Qwant Tasks</a>
          </div>
        </nav>

        {this.renderConnectionStatus()}

        {this.renderConnectButton()}

        {Object.keys(items).map((item, i) => (
          <Item
            key={i}
            item={item}
            checked={items[item]}
            onChange={() => this.handleChangeChecked(item)}
            onClickTrash={() => this.handleClickTrash(item)}
          />)
        )}

        <form onSubmit={this.handleSubmit}>
          <input
            className='uk-input uk-form-width-large'
            type='text'
            placeholder='New Task'
            value={item}
            onChange={this.handleChange}
          />
          <button
            className='uk-button uk-form-width-small uk-button-primary'
            type='submit'
            onSubmit={this.handleSubmit}
            disabled={!logged}
          >Add task
          </button>
        </form>
      </div>
    )
  }
}

export default App
