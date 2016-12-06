import "babel-polyfill";

import "rxjs";
import * as RxDB from "rxdb";
import { mySchema } from "./my-schema";

import React from "react";
import injectTapEventPlugin from "react-tap-event-plugin";
import ReactDOM from "react-dom";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import darkBaseTheme from "material-ui/styles/baseThemes/darkBaseTheme";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import AppBar from "material-ui/AppBar";
import Paper from "material-ui/Paper";
import TextField from "material-ui/TextField";
import { Card, CardHeader, CardTitle, CardText, CardActions } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import Delete from "material-ui/svg-icons/action/delete";
import Snackbar from "material-ui/Snackbar";

injectTapEventPlugin();

export class RxDbChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newMessage: "", messages: [], syncState: null,
    };
  }

  async componentDidMount() {
    const myCollection = await db.collection("myCollection", mySchema);
    myCollection.query().sort({id: 1}).$.filter(docs => !!docs).map(docs => docs.map(doc => (
      {id: doc.get("id"), message: doc.get("message")}
    ))).subscribe(messages => {
      this.setState({messages: messages.reverse()});
    });
    this.myCollection = myCollection;
    this.myCollection.sync("http://localhost:5000/my-db")
    .on("error", () => this.setState({syncState: "error"}))
    .on("active", () => console.log("active!"))
    .on("paused", () => console.log("paused!"))
    .on("denied", () => console.log("denied!"))
    .on("complete", () => console.log("complete!"))
    ;
  }

  async handleOnSubmit(e) {
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
        <Card key={id} style={{marginBottom: 20}}>
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
        <div style={{padding: 30}}>
          <form style={{marginBottom: 20}} onSubmit={this.handleOnSubmit.bind(this)}>
            <TextField
              fullWidth={true}
              hintText="Hit enter to post"
              floatingLabelText="Message"
              value={this.state.newMessage}
              onChange={this.handleOnChangeNewMessage.bind(this)}
            />
          </form>
          <div>{this.renderMessages()}</div>
          <Snackbar 
            message="Cannot sync to remote server"
            autoHideDuration={5000}
            open={this.state.syncState==="error"}
          />
        </div>
      </div>
    );
  }
}

const App = () => {
  if (!window.process) {
    return (<MuiThemeProvider><RxDbChat /></MuiThemeProvider>);
  } else {
    // for Electron
    document.documentElement.style.backgroundColor = "#303030";
    return (<MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}><RxDbChat /></MuiThemeProvider>);
  }
};

let db;

// RxDB.plugin(require("pouchdb-adapter-memory"));
RxDB.plugin(require("rxdb-adapter-localstorage"));
RxDB.plugin(require("pouchdb-adapter-http"));
RxDB.plugin(require("pouchdb-replication"));
// RxDB.create("http://localhost:5000/my-db", "http").then(_db => {
RxDB.create("myDb", "localstorage").then(_db => {
  db = _db;
  console.log(db);
  ReactDOM.render(<App />, document.getElementById('app'));
});

