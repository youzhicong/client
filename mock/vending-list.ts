import type { MockMethod } from 'vite-plugin-mock'

// 模拟贩卖机数据
const vendingMachines = [
  {
    id: 'VM_001',
    name: '1号贩卖机',
    location: '办公楼 A 座一层',
    status: 'online',
    temperature: 5.2,
    productCount: 8,
    todaySales: 68,
    todayRevenue: 486,
    lastMaintenance: '2026-01-15',
    createTime: '2025-06-01',
  },
  {
    id: 'VM_002',
    name: '2号贩卖机',
    location: '办公楼 B 座大厅',
    status: 'online',
    temperature: 4.8,
    productCount: 12,
    todaySales: 42,
    todayRevenue: 315,
    lastMaintenance: '2026-01-20',
    createTime: '2025-07-15',
  },
  {
    id: 'VM_003',
    name: '3号贩卖机',
    location: '食堂入口',
    status: 'warning',
    temperature: 7.5,
    productCount: 10,
    todaySales: 95,
    todayRevenue: 720,
    lastMaintenance: '2026-01-10',
    createTime: '2025-08-20',
  },
  {
    id: 'VM_004',
    name: '4号贩卖机',
    location: '宿舍楼 C 栋',
    status: 'offline',
    temperature: 0,
    productCount: 6,
    todaySales: 0,
    todayRevenue: 0,
    lastMaintenance: '2025-12-25',
    createTime: '2025-09-10',
  },
  {
    id: 'VM_005',
    name: '5号贩卖机',
    location: '图书馆一楼',
    status: 'online',
    temperature: 5.0,
    productCount: 8,
    todaySales: 35,
    todayRevenue: 280,
    lastMaintenance: '2026-01-28',
    createTime: '2025-10-05',
  },
]

export default [
  // 获取贩卖机列表
  {
    url: '/api/vending/list',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const { keyword, status, page = '1', pageSize = '10' } = query

      let list = [...vendingMachines]

      // 关键词搜索
      if (keyword) {
        list = list.filter(
          (item) =>
            item.name.includes(keyword) ||
            item.location.includes(keyword) ||
            item.id.includes(keyword),
        )
      }

      // 状态筛选
      if (status) {
        list = list.filter((item) => item.status === status)
      }

      // 分页
      const start = (parseInt(page) - 1) * parseInt(pageSize)
      const end = start + parseInt(pageSize)
      const pageList = list.slice(start, end)

      return {
        code: 200,
        message: 'success',
        data: {
          list: pageList,
          total: list.length,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
        },
      }
    },
  },
  // 获取单个贩卖机详情
  {
    url: '/api/vending/detail/:id',
    method: 'get',
    response: ({ params }: { params: { id: string } }) => {
      const machine = vendingMachines.find((m) => m.id === params.id)
      if (machine) {
        return { code: 200, message: 'success', data: machine }
      }
      return { code: 404, message: '贩卖机不存在' }
    },
  },
  // 新增贩卖机
  {
    url: '/api/vending/add',
    method: 'post',
    response: ({ body }: { body: { name: string; location: string } }) => {
      const newMachine = {
        id: `VM_${String(vendingMachines.length + 1).padStart(3, '0')}`,
        name: body.name,
        location: body.location,
        status: 'offline',
        temperature: 0,
        productCount: 0,
        todaySales: 0,
        todayRevenue: 0,
        lastMaintenance: '-',
        createTime: new Date().toISOString().split('T')[0],
      }
      vendingMachines.push(newMachine)
      return { code: 200, message: '添加成功', data: newMachine }
    },
  },
  // 修改贩卖机
  {
    url: '/api/vending/update',
    method: 'put',
    response: ({
      body,
    }: {
      body: { id: string; name: string; location: string; status: string }
    }) => {
      const index = vendingMachines.findIndex((m) => m.id === body.id)
      if (index > -1) {
        vendingMachines[index] = { ...vendingMachines[index], ...body }
        return { code: 200, message: '修改成功', data: vendingMachines[index] }
      }
      return { code: 404, message: '贩卖机不存在' }
    },
  },
  // 删除贩卖机
  {
    url: '/api/vending/delete/:id',
    method: 'delete',
    response: ({ params }: { params: { id: string } }) => {
      const index = vendingMachines.findIndex((m) => m.id === params.id)
      if (index > -1) {
        vendingMachines.splice(index, 1)
        return { code: 200, message: '删除成功' }
      }
      return { code: 404, message: '贩卖机不存在' }
    },
  },
] as MockMethod[]
