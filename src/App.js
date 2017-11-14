import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as constants from './constants';

const buttonCssClear = {
  backgroundColor: 'transparent',
  border: 'none',
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { items: [], inputValue: '', selected: null };
    this.insert = this.insert.bind(this);
    this.updateSelected = this.updateSelected.bind(this);

    this.onInsertKeyUp = this.onInsertKeyUp.bind(this);
    this.onInsertChange = this.onInsertChange.bind(this);
    this.onUpdateKeyUp = this.onUpdateKeyUp.bind(this);
    this.onUpdateChange = this.onUpdateChange.bind(this);

    this.onInsertClick = this.onInsertClick.bind(this);
    this.onEditClick = this.onEditClick.bind(this);
    this.onSaveClick = this.onSaveClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
  }
  componentDidMount() {
    fetch(`${constants.API_URL}items`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.status > 200) {
          console.error(response.statusText);
        } else {
          return response.json();
        }
      })
      .then(json => {
        if (json) {
          this.setState(prev => ({ items: json }));
        }
      })
      .catch(error => console.error(error));

    const sse = new EventSource(`${constants.API_URL}sse/items`);
    sse.addEventListener('message', msg => {
      if (msg) {
        if (msg.data) {
          var json = JSON.parse(msg.data);
          if (json) {
            switch (json.key) {
              case 'item_created':
                this.setState(prev => ({ items: [...prev.items, json.value] }));
                break;
              case 'item_updated':
                this.setState(prev => ({
                  items: prev.items.map(i => {
                    if (i.id === json.value.id) {
                      i = json.value;
                    }
                    return i;
                  }),
                }));
                break;
              case 'item_deleted':
                const items = this.state.items;
                items.splice(
                  items.indexOf(items.find(i => i.id === json.value)),
                  1
                );
                this.setState(prev => ({
                  items,
                }));
                break;
              default:
                console.log(json);
                break;
            }
          }
        }
      }
    });
  }

  insert() {
    if (this.state.inputValue.trim() !== '') {
      fetch(`${constants.API_URL}items`, {
        method: 'POST',
        body: JSON.stringify({ label: this.state.inputValue.trim() }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.status > 200) {
            console.error(response.statusText);
          } else {
            this.setState(prev => ({
              inputValue: '',
            }));
          }
        })
        .catch(error => console.error(error));
    }
  }
  updateSelected() {
    if (this.state.selected.label.trim() !== '') {
      fetch(`${constants.API_URL}items/${this.state.selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({ label: this.state.selected.label.trim() }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.status > 200) {
            console.error(response.statusText);
          } else {
            this.setState(prev => ({
              selected: null,
            }));
          }
        })
        .catch(error => console.error(error));
    }
  }

  onInsertKeyUp(evt) {
    if (evt.keyCode === 13) {
      this.insert();
    }
  }
  onInsertChange(evt) {
    const inputValue = evt.target.value;
    this.setState(prev => ({ inputValue }));
  }
  onUpdateKeyUp(evt) {
    if (evt.keyCode === 13) {
      this.updateSelected();
    }
  }
  onUpdateChange(evt) {
    const selected = this.state.selected;
    selected.label = evt.target.value;
    this.setState(prev => ({ selected }));
  }

  onInsertClick() {
    this.insert();
  }
  onEditClick(item) {
    const selected = { id: item.id, label: item.label };
    this.setState(prev => ({ selected }));
  }
  onSaveClick() {
    this.updateSelected();
  }
  onCancelClick() {
    this.setState(prev => ({ selected: null }));
  }
  onDeleteClick(item) {
    fetch(`${constants.API_URL}items/${item.id}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.status > 200) {
          console.error(response.statusText);
        }
      })
      .catch(error => console.error(error));
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Sandbox UI</h1>
        </header>
        <div className="App-intro">
          <p>
            <input
              autoFocus
              type="text"
              onKeyUp={this.onInsertKeyUp}
              onChange={this.onInsertChange}
              value={this.state.inputValue}
            />
            <button onClick={this.onInsertClick} style={buttonCssClear}>
              <i className="fa fa-plus" />
            </button>
          </p>
          {this.state.items.length === 0 && <span>No Item</span>}
          {this.state.items.length > 0 && (
            <div
              style={{
                width: '90%',
                padding: '0 5%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'start',
                justifyContent: 'space-beetwen',
              }}>
              {this.state.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                  }}>
                  {this.state.selected &&
                    this.state.selected.id === item.id && (
                      <input
                        type="text"
                        autoFocus
                        value={this.state.selected.label}
                        onKeyUp={this.onUpdateKeyUp}
                        onChange={this.onUpdateChange}
                      />
                    )}
                  {(!this.state.selected ||
                    this.state.selected.id !== item.id) &&
                    item.label}
                  <div>
                    {this.state.selected &&
                      this.state.selected.id === item.id && (
                        <span>
                          <button
                            onClick={() => this.onSaveClick()}
                            style={buttonCssClear}>
                            <i className="fa fa-save" />
                          </button>
                          <button
                            onClick={() => this.onCancelClick()}
                            style={buttonCssClear}>
                            <i className="fa fa-remove" />
                          </button>
                        </span>
                      )}
                    {(!this.state.selected ||
                      this.state.selected.id !== item.id) && (
                      <button
                        onClick={() => this.onEditClick(item)}
                        style={buttonCssClear}>
                        <i className="fa fa-pencil" />
                      </button>
                    )}

                    <button
                      onClick={() => this.onDeleteClick(item)}
                      style={buttonCssClear}>
                      <i className="fa fa-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default App;
