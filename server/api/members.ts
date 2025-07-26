const members = [{
  name: 'Xét tuyển ĐỢT 1 năm 2025 (ĐGNL CMC-Test, Học bạ, THPT, Tuyển thẳng) - Từ ngày 16 - 28/07/2025',
  username: 'Kết thúc nộp hồ sơ tuyển sinh: Còn 6 ngày 1 giờ 40 phút 39 giây',
  role: 'member',
  avatar: { src: 'https://ipx.nuxt.com/f_auto,s_192x192/gh_avatar/antfu' }
}, {
  name: 'Phương thức 1 (CMC401): Xét tuyển dựa vào kỳ thi ĐGNL CMC',
  username: 'Kết thúc nộp hồ sơ tuyển sinh: Còn 6 ngày 1 giờ 40 phút 39 giây',
  role: 'member',
  avatar: { src: 'https://ipx.nuxt.com/f_auto,s_192x192/gh_avatar/larbish' }
}, {
  name: 'Phương thức 2 (CMC200): Xét tuyển dựa vào kết quả học tập bậc THPT (học bạ)',
  username: 'Kết thúc nộp hồ sơ tuyển sinh: Còn 6 ngày 1 giờ 40 phút 39 giây',
  role: 'owner',
  avatar: { src: 'https://ipx.nuxt.com/f_auto,s_192x192/gh_avatar/benjamincanac' }
}, {
  name: 'Phương thức 4 (CMC303): Xét tuyển thẳng',
  username: 'Kết thúc nộp hồ sơ tuyển sinh: Còn 6 ngày 1 giờ 40 phút 39 giây',
  role: 'member',
  avatar: { src: 'https://ipx.nuxt.com/f_auto,s_192x192/gh_avatar/celinedumerc' }
}]

export default eventHandler(async () => {
  return members
})
