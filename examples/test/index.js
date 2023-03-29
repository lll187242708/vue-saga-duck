import {connectWithDuck} from 'vue-saga-duck';
import Root from './Page';
import Duck from './PageDuck';

export default connectWithDuck(Root, Duck);
