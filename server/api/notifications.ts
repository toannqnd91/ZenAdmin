import { sub } from 'date-fns'

const notifications = [{
  id: 1,
  unread: true,
  sender: {
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=2'
    }
  },
  body: 'đã gửi cho bạn một tin nhắn',
  date: sub(new Date(), { minutes: 7 }).toISOString()
}, {
  id: 2,
  sender: {
    name: 'Trần Thị Bình'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { hours: 1 }).toISOString()
}, {
  id: 3,
  unread: true,
  sender: {
    name: 'Lê Minh Châu',
    email: 'leminhchau@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=3'
    }
  },
  body: 'đã gửi cho bạn một tin nhắn',
  date: sub(new Date(), { hours: 3 }).toISOString()
}, {
  id: 4,
  sender: {
    name: 'Phạm Quốc Dũng',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=4'
    }
  },
  body: 'đã thêm bạn vào một dự án',
  date: sub(new Date(), { hours: 3 }).toISOString()
}, {
  id: 5,
  sender: {
    name: 'Hoàng Thị Duyên',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=5'
    }
  },
  body: 'đã bỏ giỏ hàng',
  date: sub(new Date(), { hours: 7 }).toISOString()
}, {
  id: 6,
  sender: {
    name: 'Vũ Anh Tuấn',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=6'
    }
  },
  body: 'đã mua sản phẩm của bạn',
  date: sub(new Date(), { days: 1, hours: 3 }).toISOString()
}, {
  id: 7,
  unread: true,
  sender: {
    name: 'Đỗ Thị Hạnh',
    email: 'dothihanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=8'
    }
  },
  body: 'đã gửi cho bạn một tin nhắn',
  date: sub(new Date(), { days: 2 }).toISOString()
}, {
  id: 8,
  sender: {
    name: 'Ngô Văn Khánh',
    email: 'ngovankhanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=9'
    }
  },
  body: 'đã yêu cầu hoàn tiền',
  date: sub(new Date(), { days: 5, hours: 4 }).toISOString()
}, {
  id: 9,
  unread: true,
  sender: {
    name: 'Phan Thị Lan',
    email: 'phanthilan@example.com'
  },
  body: 'đã gửi cho bạn một tin nhắn',
  date: sub(new Date(), { days: 6 }).toISOString()
}, {
  id: 10,
  sender: {
    name: 'Bùi Văn Lâm'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 6 }).toISOString()
}, {
  id: 11,
  sender: {
    name: 'Nguyễn Thị Mai'
  },
  body: 'đã bỏ giỏ hàng',
  date: sub(new Date(), { days: 7 }).toISOString()
}, {
  id: 12,
  sender: {
    name: 'Trần Văn Nam'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 9 }).toISOString()
}, {
  id: 13,
  sender: {
    name: 'Đỗ Thị Hạnh',
    email: 'dothihanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=8'
    }
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 10 }).toISOString()
}, {
  id: 14,
  sender: {
    name: 'Ngô Văn Khánh',
    email: 'ngovankhanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=9'
    }
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 11 }).toISOString()
}, {
  id: 15,
  sender: {
    name: 'Phan Thị Lan'
  },
  body: 'đã mua sản phẩm của bạn',
  date: sub(new Date(), { days: 12 }).toISOString()
}, {
  id: 16,
  sender: {
    name: 'Bùi Văn Lâm',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=16'
    }
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 13 }).toISOString()
}, {
  id: 17,
  sender: {
    name: 'Nguyễn Thị Mai'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 14 }).toISOString()
}, {
  id: 18,
  sender: {
    name: 'Trần Văn Nam'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 15 }).toISOString()
}, {
  id: 19,
  sender: {
    name: 'Đỗ Thị Hạnh',
    email: 'dothihanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=8'
    }
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 16 }).toISOString()
}, {
  id: 20,
  sender: {
    name: 'Ngô Văn Khánh',
    email: 'ngovankhanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=9'
    }
  },
  body: 'đã mua sản phẩm của bạn',
  date: sub(new Date(), { days: 17 }).toISOString()
}, {
  id: 21,
  sender: {
    name: 'Phan Thị Lan'
  },
  body: 'đã bỏ giỏ hàng',
  date: sub(new Date(), { days: 17 }).toISOString()
}, {
  id: 22,
  sender: {
    name: 'Bùi Văn Lâm'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 18 }).toISOString()
}, {
  id: 23,
  sender: {
    name: 'Nguyễn Thị Mai'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 19 }).toISOString()
}, {
  id: 24,
  sender: {
    name: 'Trần Văn Nam',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=24'
    }
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 20 }).toISOString()
}, {
  id: 25,
  sender: {
    name: 'Đỗ Thị Hạnh',
    email: 'dothihanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=8'
    }
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 20 }).toISOString()
}, {
  id: 26,
  sender: {
    name: 'Ngô Văn Khánh',
    email: 'ngovankhanh@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=9'
    }
  },
  body: 'đã bỏ giỏ hàng',
  date: sub(new Date(), { days: 21 }).toISOString()
}, {
  id: 27,
  sender: {
    name: 'Phan Thị Lan'
  },
  body: 'đã đăng ký vào danh sách email của bạn',
  date: sub(new Date(), { days: 22 }).toISOString()
}]

export default eventHandler(async () => {
  return notifications
})
