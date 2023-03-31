import { DuckMap } from 'vue-saga-duck';
import {getMockGridData} from '../mock';
import GridPageDuck from '../ducks/GridPageDuck';

export default class Ducks extends GridPageDuck {
    get recordKey() {
        return 'instanceId';
    }
    getData = async () => await getMockGridData();
}
