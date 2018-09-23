import { observable } from "mobx"

class Router {
  @observable name;
  
  constructor(name) {
    this.name = name;
  }
}
