export default class RouterManager {
  constructor(serializedStateAdapter, routersStateAdapter) {
    this.serializedStateAdapter = serializedStateAdapter || new DefaultSerializedStateAdapter();
    this.routersStateAdapter = routersStateAdapter;
  }
}
