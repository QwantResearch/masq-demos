import React from 'react'
import PropTypes from 'prop-types'

import { ReactComponent as Trash } from '../icons/trash.svg'

function Item ({ item, checked, onChange, onClickTrash }) {
  const style = { textDecoration: checked ? 'line-through' : '' }
  return (
    <div className='Item uk-card uk-card-default uk-card-small uk-card-body'>
      <div className='content' style={style}>
        <input className='uk-checkbox' type='checkbox' checked={checked} onChange={onChange} />
        {item}
        <Trash className='Trash' onClick={onClickTrash} />
      </div>
    </div>
  )
}

Item.propTypes = {
  item: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
  onClickTrash: PropTypes.func
}

export default Item
