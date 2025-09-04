export default defineAppConfig({
  ui: {
    colors: {
      primary: 'zentheme', // đặt màu primary mặc định là zentheme
      neutral: 'zinc',
      text: 'zentheme' // màu chữ mặc định dùng ZenTheme
    },
    colorPalette: [
      'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'zentheme'
    ]
  },
  colorMode: {
    preference: 'light'
  },
  settings: {
    title: 'Cơ Khí Tam Long',
    description: 'Cơ Khí Tam Long - Nơi cung cấp các sản phẩm chất lượng cao',
    favicon: '/favicon.png',
    team: {
      label: 'Cơ Khí Tam Long',
      avatar: {
        src: '',
        alt: 'Cơ Khí Tam Long'
      }
    }
  }
})
