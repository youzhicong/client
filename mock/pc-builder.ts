import type { MockMethod } from 'vite-plugin-mock'

type Platform = 'jd' | 'tmall' | 'pdd'

type PartPrice = {
  platform: Platform
  price: number
  url: string
}

type PartOption = {
  id: string
  name: string
  specs: string
  score: number
  prices: PartPrice[]
}

type PartCategory = {
  key: string
  label: string
  options: PartOption[]
}

const categories: PartCategory[] = [
  {
    key: 'cpu',
    label: 'CPU',
    options: [
      {
        id: 'cpu-12400f',
        name: 'Intel i5-12400F',
        specs: '6核12线程',
        score: 72,
        prices: [
          { platform: 'jd', price: 899, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 929, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 859, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'cpu-7500f',
        name: 'AMD Ryzen 5 7500F',
        specs: '6核12线程',
        score: 79,
        prices: [
          { platform: 'jd', price: 1049, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 1079, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 999, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'cpu-14600kf',
        name: 'Intel i5-14600KF',
        specs: '14核20线程',
        score: 91,
        prices: [
          { platform: 'jd', price: 1899, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 1949, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 1829, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  },
  {
    key: 'motherboard',
    label: '主板',
    options: [
      {
        id: 'mb-b660m',
        name: 'B660M DDR4',
        specs: 'mATX / PCIe4.0',
        score: 70,
        prices: [
          { platform: 'jd', price: 649, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 669, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 629, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'mb-b650m',
        name: 'B650M WIFI',
        specs: 'mATX / DDR5',
        score: 82,
        prices: [
          { platform: 'jd', price: 899, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 939, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 859, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'mb-z790',
        name: 'Z790 ATX',
        specs: 'ATX / 高供电',
        score: 93,
        prices: [
          { platform: 'jd', price: 1599, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 1669, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 1529, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  },
  {
    key: 'gpu',
    label: '显卡',
    options: [
      {
        id: 'gpu-4060',
        name: 'RTX 4060 8G',
        specs: '1080P 高帧',
        score: 76,
        prices: [
          { platform: 'jd', price: 2099, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 2149, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 1999, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'gpu-4070s',
        name: 'RTX 4070 Super',
        specs: '2K 游戏甜点',
        score: 90,
        prices: [
          { platform: 'jd', price: 4599, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 4699, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 4399, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'gpu-7800xt',
        name: 'RX 7800 XT',
        specs: '2K 光栅强项',
        score: 88,
        prices: [
          { platform: 'jd', price: 3899, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 3999, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 3729, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  },
  {
    key: 'memory',
    label: '内存',
    options: [
      {
        id: 'ram-16-3200',
        name: '16GB DDR4 3200',
        specs: '8GB x2',
        score: 66,
        prices: [
          { platform: 'jd', price: 229, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 239, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 209, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'ram-32-6000',
        name: '32GB DDR5 6000',
        specs: '16GB x2',
        score: 84,
        prices: [
          { platform: 'jd', price: 589, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 609, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 549, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'ram-64-6400',
        name: '64GB DDR5 6400',
        specs: '32GB x2',
        score: 94,
        prices: [
          { platform: 'jd', price: 1199, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 1249, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 1129, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  },
  {
    key: 'storage',
    label: '硬盘',
    options: [
      {
        id: 'ssd-1t-pcie4',
        name: '1TB PCIe4.0 SSD',
        specs: '读速 7000MB/s',
        score: 75,
        prices: [
          { platform: 'jd', price: 379, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 399, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 349, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'ssd-2t-pcie4',
        name: '2TB PCIe4.0 SSD',
        specs: '读速 7400MB/s',
        score: 85,
        prices: [
          { platform: 'jd', price: 739, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 769, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 699, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'ssd-2t-pro',
        name: '2TB 高端 SSD',
        specs: '带缓存 / 旗舰颗粒',
        score: 92,
        prices: [
          { platform: 'jd', price: 999, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 1049, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 959, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  },
  {
    key: 'psu',
    label: '电源',
    options: [
      {
        id: 'psu-550',
        name: '550W 金牌',
        specs: '全模组',
        score: 68,
        prices: [
          { platform: 'jd', price: 349, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 359, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 329, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'psu-750',
        name: '750W 金牌',
        specs: 'ATX3.0',
        score: 82,
        prices: [
          { platform: 'jd', price: 519, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 539, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 489, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'psu-850',
        name: '850W 金牌',
        specs: '全日系电容',
        score: 90,
        prices: [
          { platform: 'jd', price: 699, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 739, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 669, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  },
  {
    key: 'cooler',
    label: '散热器',
    options: [
      {
        id: 'cool-air',
        name: '双塔风冷',
        specs: '6 热管',
        score: 70,
        prices: [
          { platform: 'jd', price: 159, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 169, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 139, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'cool-240',
        name: '240 水冷',
        specs: 'ARGB',
        score: 82,
        prices: [
          { platform: 'jd', price: 399, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 419, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 369, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'cool-360',
        name: '360 水冷',
        specs: '高负载压制',
        score: 90,
        prices: [
          { platform: 'jd', price: 599, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 629, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 569, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  },
  {
    key: 'case',
    label: '机箱',
    options: [
      {
        id: 'case-matx',
        name: 'mATX 紧凑机箱',
        specs: '前网孔风道',
        score: 65,
        prices: [
          { platform: 'jd', price: 199, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 209, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 179, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'case-atx',
        name: 'ATX 海景房机箱',
        specs: '双面钢化玻璃',
        score: 78,
        prices: [
          { platform: 'jd', price: 299, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 319, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 269, url: 'https://mobile.yangkeduo.com/' }
        ]
      },
      {
        id: 'case-premium',
        name: '高端静音机箱',
        specs: '降噪 + 高扩展',
        score: 90,
        prices: [
          { platform: 'jd', price: 599, url: 'https://item.jd.com/' },
          { platform: 'tmall', price: 639, url: 'https://detail.tmall.com/' },
          { platform: 'pdd', price: 569, url: 'https://mobile.yangkeduo.com/' }
        ]
      }
    ]
  }
]

export default [
  {
    url: '/api/pc-builder/prices',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: {
          updatedAt: new Date().toISOString(),
          categories
        }
      }
    }
  }
] as MockMethod[]
