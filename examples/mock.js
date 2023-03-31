async function delay() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('成功');
      }, 1000);
    })
  }
  export const getMockGridData = async () => {
    await delay();
    return await {
      totalCount: 20,
      list: [
        {
          instanceId: 'ins-4m99aio4',
          instanceName: 'Hongkong VPN',
          status: 'running',
          area: '香港一区',
          modal: '标准型 S1',
          publicIP: '119.28.142.24',
          privateIP: '10.144.77.75',
        },
        {
          instanceId: 'ins-3e7y5ww3',
          instanceName: 'Guangzhou Test',
          status: 'stopped',
          area: '广州三区',
          modal: '标准型 S1',
          publicIP: '112.30.42.241',
          privateIP: '10.121.72.123',
        },
        {
          instanceId: 'ins-9edyef1y53',
          instanceName: 'Guangzhou Test',
          status: 'running',
          area: '重庆一区',
          modal: '标准型 S1',
          publicIP: '112.24.12.941',
          privateIP: '10.221.62.821',
        },
        {
          instanceId: 'ins-9eddyvq13',
          instanceName: 'Guangzhou Test',
          status: 'running',
          area: '重庆一区',
          modal: '标准型 S1',
          publicIP: '112.24.12.941',
          privateIP: '10.221.62.821',
        },
        {
          instanceId: 'ins-fh9ey1y53',
          instanceName: 'Guangzhou Test',
          status: 'running',
          area: '重庆一区',
          modal: '标准型 S1',
          publicIP: '112.24.12.941',
          privateIP: '10.221.62.821',
        }
      ],
    };
  }