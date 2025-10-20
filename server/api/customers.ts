import type { User } from '~/types'

const customers: User[] = [{
  id: 1,
  name: 'Nguyễn Văn An',
  email: 'nguyenvanan@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=1'
  },
  status: 'subscribed',
  location: 'Hà Nội, Việt Nam'
}, {
  id: 2,
  name: 'Trần Thị Bình',
  email: 'tranthibinh@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=2'
  },
  status: 'unsubscribed',
  location: 'TP. Hồ Chí Minh, Việt Nam'
}, {
  id: 3,
  name: 'Lê Minh Châu',
  email: 'leminhchau@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=3'
  },
  status: 'bounced',
  location: 'Đà Nẵng, Việt Nam'
}, {
  id: 4,
  name: 'Phạm Quốc Dũng',
  email: 'phamquocdung@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=4'
  },
  status: 'subscribed',
  location: 'Cần Thơ, Việt Nam'
}, {
  id: 5,
  name: 'Hoàng Thị Duyên',
  email: 'hoangthiduyen@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=5'
  },
  status: 'subscribed',
  location: 'Hải Phòng, Việt Nam'
}, {
  id: 6,
  name: 'Vũ Anh Tuấn',
  email: 'vuanhtuan@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=6'
  },
  status: 'subscribed',
  location: 'Nha Trang, Việt Nam'
}, {
  id: 7,
  name: 'Đỗ Thị Hạnh',
  email: 'dothihanh@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=7'
  },
  status: 'subscribed',
  location: 'Hà Nội, Việt Nam'
}, {
  id: 8,
  name: 'Ngô Văn Khánh',
  email: 'ngovankhanh@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=8'
  },
  status: 'subscribed',
  location: 'TP. Hồ Chí Minh, Việt Nam'
}, {
  id: 9,
  name: 'Phan Thị Lan',
  email: 'phanthilan@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=9'
  },
  status: 'bounced',
  location: 'Đà Nẵng, Việt Nam'
}, {
  id: 10,
  name: 'Bùi Văn Lâm',
  email: 'buivanlam@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=10'
  },
  status: 'subscribed',
  location: 'Cần Thơ, Việt Nam'
}, {
  id: 11,
  name: 'Nguyễn Thị Mai',
  email: 'nguyenthimai@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=11'
  },
  status: 'subscribed',
  location: 'Hải Phòng, Việt Nam'
}, {
  id: 12,
  name: 'Trần Văn Nam',
  email: 'tranvannam@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=12'
  },
  status: 'unsubscribed',
  location: 'Nha Trang, Việt Nam'
}, {
  id: 13,
  name: 'Lê Thị Ngọc',
  email: 'lethingoc@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=13'
  },
  status: 'unsubscribed',
  location: 'Hà Nội, Việt Nam'
}, {
  id: 14,
  name: 'Phạm Văn Phúc',
  email: 'phamvanphuc@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=14'
  },
  status: 'unsubscribed',
  location: 'TP. Hồ Chí Minh, Việt Nam'
}, {
  id: 15,
  name: 'Đỗ Thị Quỳnh',
  email: 'dothiquynh@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=15'
  },
  status: 'subscribed',
  location: 'Đà Nẵng, Việt Nam'
}, {
  id: 16,
  name: 'Ngô Văn Sơn',
  email: 'ngovanson@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=16'
  },
  status: 'subscribed',
  location: 'Cần Thơ, Việt Nam'
}, {
  id: 17,
  name: 'Bùi Thị Trang',
  email: 'buithitrang@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=17'
  },
  status: 'unsubscribed',
  location: 'Hải Phòng, Việt Nam'
}, {
  id: 18,
  name: 'Vũ Văn Việt',
  email: 'vuvanviet@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=18'
  },
  status: 'subscribed',
  location: 'Nha Trang, Việt Nam'
}, {
  id: 19,
  name: 'Trần Thị Yến',
  email: 'tranthiyen@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=19'
  },
  status: 'bounced',
  location: 'Hà Nội, Việt Nam'
}, {
  id: 20,
  name: 'Lê Văn Hùng',
  email: 'levanhung@example.com',
  avatar: {
    src: 'https://i.pravatar.cc/128?u=20'
  },
  status: 'subscribed',
  location: 'TP. Hồ Chí Minh, Việt Nam'
}]

export default eventHandler(async () => {
  return customers
})
