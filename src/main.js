import "babel-polyfill";

import "rxjs";
import * as RxDB from "rxdb";
import { mySchema } from "./my-schema";

import React from 'react';
import ReactDOM from 'react-dom';
import AppBar from "material-ui/AppBar";
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from "material-ui/TextField";
import { Card, CardHeader, CardTitle, CardText, CardActions } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import RaisedButton from 'material-ui/RaisedButton';
import Delete from "material-ui/svg-icons/action/delete";

export class MyAwesomeReactComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {newMessage: "", messages: []};
  }

  async componentDidMount() {
    const myCollection = await db.collection("myCollection", mySchema);
    myCollection.query().sort({id: 1}).$.filter(docs => !!docs).map(docs => docs.map(doc => (
      {id: doc.get("id"), message: doc.get("message")}
    ))).subscribe(messages => {
      this.setState({messages: messages.reverse()});
    });
    this.myCollection = myCollection;
    this.myCollection.sync("http://localhost:5000/my-db");
  }

  async handleOnClick(e) {
   e && e.preventDefault();
   const id = Date.now() + "";
   const newMessage = {id, message: this.state.newMessage};
   await this.myCollection.insert(newMessage);
   this.setState({newMessage: ""});
  }

  async handleOnClickDetele(id) {
    const doc = await this.myCollection.findOne(id).exec();
    if (!doc) return;
    await doc.remove();
    this.setState({messages: this.state.messages.filter(m => m.id !==id)});
  }

  handleOnChangeNewMessage(e) {
    this.setState({newMessage: e.target.value});
  }

  renderMessages() {
    const {messages} = this.state;
    return messages.map(({id, message}) => {
      const date = new Date(+id).toLocaleString();
      return (
        <Card key={id}>
          <CardHeader title={date} />
          <CardText>{message}</CardText>
          <CardActions>
            <IconButton onClick={this.handleOnClickDetele.bind(this, id)}>
              <Delete />
            </IconButton>
          </CardActions>
        </Card>
      );
    });
  }

  render() {
    return (
      <div>
        <AppBar title="RxDB Chat" />
        <form onSubmit={this.handleOnClick.bind(this)}>
          <TextField
            fullWidth={true}
            floatingLabelText="Message"
            value={this.state.newMessage}
            onChange={this.handleOnChangeNewMessage.bind(this)}
          />
          <RaisedButton
            label="Send"
            primary={true}
            onClick={this.handleOnClick.bind(this)}
           />
        </form>
        <div>{this.renderMessages()}</div>
      </div>
    );
  }
}

const App = () => (
  <MuiThemeProvider>
    <MyAwesomeReactComponent />
  </MuiThemeProvider>
);

let db;

RxDB.plugin(require("pouchdb-adapter-memory"));
RxDB.plugin(require("rxdb-adapter-localstorage"));
RxDB.plugin(require("pouchdb-adapter-http"));
RxDB.plugin(require("pouchdb-replication"));
// RxDB.create("http://localhost:5000/my-db", "http").then(_db => {
RxDB.create("myDb", "localstorage").then(_db => {
  db = _db;
  console.log(db);
  ReactDOM.render(<App />, document.getElementById('app'));
});

