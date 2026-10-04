export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/settings/index',
    'pages/examples/index',
    'pages/examples/detail',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '多端模板',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#64748b',
    selectedColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/settings/index', text: '设置' },
    ],
  },
});
