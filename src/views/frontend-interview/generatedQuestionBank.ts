import type { InterviewSection } from './types'

export const generatedFoundationSections: InterviewSection[] = [
  {
    key: 'generated-baidu-developer-foundation',
    title: '自动采集 / 百度开发者中心',
    desc: '来自百度开发者中心文章页的前端面试题',
    questions: [
      {
        id: 'baidu-developer-frontend-200-01',
        title: 'HTML5 相比 HTML4 有哪些新增的表单输入类型？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'HTML5 新增了多种表单输入类型，如 email、url、number、range、date、time 等，这些类型提供了更好的输入验证和更友好的用户界面。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-02',
        title: '如何使用 HTML5 实现拖放功能？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          '通过 HTML5 的 draggable 属性及相关的拖放事件（如 dragstart、dragover、drop 等）可以实现拖放功能。开发者需要为拖动的元素设置 draggable="true"，并处理相应的事件。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-03',
        title: 'HTML5 引入了哪些新的存储方式？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'HTML5 引入了 localStorage 和 sessionStorage 两种新的存储方式。localStorage 用于长期存储数据，浏览器关闭后数据不丢失；sessionStorage 的数据在浏览器关闭后自动删除。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-04',
        title: 'CSS3 中的 Flexbox 布局包含哪些主要属性？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'Flexbox 布局主要包含 flex-direction、flex-wrap、justify-content、align-items 等属性。这些属性用于控制弹性容器的布局方向、换行行为、项目在主轴和交叉轴上的对齐方式等。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-05',
        title: '如何使用 CSS3 实现动画效果？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'CSS3 可以通过 @keyframes 规则定义动画序列，然后使用 animation 属性将动画应用到元素上。animation 属性可以控制动画的持续时间、延迟时间、迭代次数等。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-06',
        title: '解释 CSS3 的媒体查询（Media Queries）及其作用？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'CSS3 的媒体查询允许根据不同的设备特性（如屏幕宽度、分辨率等）应用不同的样式规则。这使得开发者能够创建响应式布局，以适应不同大小的设备和屏幕。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-07',
        title: 'JavaScript 中的作用域和闭包是什么？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          '作用域决定了变量在代码中的可见性和生命周期。闭包是一种特殊的函数，它能够访问定义时作用域内的变量，即使该函数在其原始作用域外被调用。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-08',
        title: '请解释 JavaScript 的事件循环机制？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'JavaScript 的事件循环机制基于宏任务和微任务队列。浏览器会不断从任务队列中取出任务并执行，直到任务队列为空。宏任务包括整体代码脚本、setTimeout、setInterval 等；微任务包括 Promise 的回调、process.nextTick（Node.js）等。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-09',
        title: 'JavaScript 中的 this 关键字是如何工作的？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'JavaScript 中的 this 关键字指向函数的调用者。在全局上下文中，this 指向全局对象（在浏览器中是 window）；在函数上下文中，this 的值取决于函数是如何被调用的（如通过 call、apply、bind 方法或作为对象的方法调用）。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'baidu-developer-frontend-200-12',
        title: 'Angular 框架中的依赖注入（DI）是如何工作的？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'Angular 框架中的依赖注入是一种控制反转（IoC）技术，它允许开发者声明组件的依赖项，并在运行时由 Angular 自动提供这些依赖项。这有助于减少组件之间的耦合度，提高代码的可维护性和可测试性。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  },
  {
    key: 'generated-juejin-general-foundation',
    title: '自动采集 / 掘金通用题',
    desc: '来自掘金搜索接口的前端通用面试题文章',
    questions: [
      {
        id: 'juejin-frontend-general-03',
        title: '前端面试常见的 10 个场景题',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', '面试', '前端', '求职'],
        answer: [
          '大家好，我是双越，wangEditor 作者，前百度 滴滴 资深前端工程师，慕课网金牌讲师。本文总结了几个前端面试常见的场景题，以及回答的重点和注意事项。'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/7612495518645174323',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-frontend-general-04',
        title: '「2021」高频前端面试题汇总之JavaScript篇（上）',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', '面试', '前端'],
        answer: [
          '高频前端面试题汇总之JavaScript篇，前端面试题汇总系列文章的JavaScript篇，长期更新，欢迎收藏、点赞！'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/6940945178899251230',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-frontend-general-05',
        title: '2024前端高频面试题之-- JS篇',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', 'JavaScript', '前端', '面试'],
        answer: [
          'js基本数据类型有哪些及它们的区别 JavaScript共有八种数据类型，分别是 Undefined、Null、Boolean、Number、String、Object、Symbol、BigInt'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/7330065707358208010',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-frontend-general-06',
        title: '前端面试题-JavaScript高级篇',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', '前端', 'JavaScript', '面试'],
        answer: [
          '以下为JavaScript高级篇面试考察点总结，具体知识点不会太详细，主要梳理面试核心考察点，为面试做准备。高级JavaScript工程师的面试不再局限于API的使用或孤立的知识点，而是聚焦于对语言、'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/7579813925996970025',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-frontend-general-08',
        title: '2025前端面试题-JavaScript基础篇',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', '前端', '面试', 'JavaScript'],
        answer: [
          '以下为JavaScript基础篇面试考察点总结，具体知识点不会太详细，主要梳理面试核心考察点，为面试做准备。掌握这些基础知识，不仅是完成日常工作的基本要求，更是未来向中高级发展的基石。'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/7578705123209625643',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  }
]

export const generatedHandwritingSections: InterviewSection[] = [
  {
    key: 'generated-juejin-handwriting',
    title: '自动采集 / 掘金手写题',
    desc: '来自掘金搜索接口的前端手写题文章',
    questions: [
      {
        id: 'juejin-handwriting-search-01',
        title: '2024前端高频面试题之-- 手写代码篇',
        level: '中级',
        tags: ['自动采集', '掘金', '前端', 'JavaScript', '面试'],
        answer: [
          '【前端面试复习系列文章】 2024前端高频面试题-- html篇 2024前端高频面试题-- CSS篇 2024前端高频面试题-- JS篇 2024前端高频面试题-- VUE篇 2024前端高频面试题'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/7353456468094599205',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-handwriting-search-02',
        title: '「2021」高频前端面试题汇总之手写代码篇',
        level: '中级',
        tags: ['自动采集', '掘金', '面试', '前端'],
        answer: [
          '高频前端面试题汇总之手写代码篇，前端面试题汇总系列文章的手写代码篇，长期更新，欢迎收藏、点赞！'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/6946136940164939813',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-handwriting-search-03',
        title: '很全面的前端面试题——手写题(上)',
        level: '中级',
        tags: ['自动采集', '掘金', '前端', 'JavaScript', '面试'],
        answer: [
          '前言 在当今竞争激烈的互联网行业，前端开发岗位的面试越来越注重对基础知识和实际动手能力的考察。手写代码环节已经成为大厂面试的标配，它不仅考察开发者对JavaScript核心概念的理解深度，更能真实反映'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/7535313355825905690',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-handwriting-search-04',
        title: '金三银四：20道前端手写面试题',
        level: '中级',
        tags: ['自动采集', '掘金', '前端', '面试'],
        answer: [
          '上一篇文章中有提到会把我最近在面试时遇到的手写面试题给整理出来，这不，他来了! （含有字节，美团等大厂面试题！）'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/7079681931662589960',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-handwriting-search-05',
        title: '前端面试必须掌握的手写题：进阶篇',
        level: '中级',
        tags: ['自动采集', '掘金', '前端', '面试', 'JavaScript'],
        answer: [
          '本文是前端面试必须掌握的手写题系列的最后一篇，这个系列几乎将我整理和遇到的题目都包含到了，这里还是想强调一下，对于特别常见的题目最好能“背”下来，直接一把梭'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/7299357176928354313',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-handwriting-search-06',
        title: '前端面试必须掌握的手写题：基础篇',
        level: '中级',
        tags: ['自动采集', '掘金', '前端', '面试', 'JavaScript'],
        answer: [
          '金九银十过了大半，笔者最近也面了一些公司，现将一些自己遇到的和收集的基础题目整理出来，后续会整理分享一些其他的信息，希望对你能有所帮助'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/7288340985230409747',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-handwriting-search-07',
        title: '前端面试必须掌握的手写题：场景篇',
        level: '中级',
        tags: ['自动采集', '掘金', '前端', '面试', 'JavaScript'],
        answer: [
          '分享一些javascript手写题目，对于特别常见的题目最好能“背”下来，在面试的时候不需要再进行推导分析直接一把梭，这里的题目有一些是自己遇到的，也有收集到的，后续会整理分享一些其他的信息'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/7293412552485928998',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-handwriting-search-08',
        title: '【JavaScript】手撕前端面试题：手写new操作符❗❗❗',
        level: '中级',
        tags: ['自动采集', '掘金', '前端', 'JavaScript', '面试'],
        answer: [
          '前言 当我们在使用构造函数的时候，要实例化一个对象，直接使用new就好了，这样新对象就继承到了构造函数的所有属性和方法。那你有思考过new是啥嘛？它的工作流程是什么样的？这也是在前端面试中经常考的一道'
        ],
        sourceName: '掘金手写题',
        sourceUrl: 'https://juejin.cn/post/7448447533070090294',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  }
]

export const generatedVueSections: InterviewSection[] = [
  {
    key: 'generated-baidu-developer-foundation-vue',
    title: '自动采集 / 百度开发者中心 / Vue',
    desc: '来自百度开发者中心文章页的前端面试题（按标题关键词分流）',
    questions: [
      {
        id: 'baidu-developer-frontend-200-11',
        title: 'Vue.js 相比其他前端框架有哪些优势？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'Vue.js 是一款渐进式 JavaScript 框架，其优势包括易于上手、灵活性高、双向数据绑定（通过 Vuex 实现状态管理）、组件化开发等。Vue.js 的学习曲线较为平缓，适合从初学者到高级开发者的不同阶段。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  },
  {
    key: 'generated-juejin-general-foundation-vue',
    title: '自动采集 / 掘金通用题 / Vue',
    desc: '来自掘金搜索接口的前端通用面试题文章（按标题关键词分流）',
    questions: [
      {
        id: 'juejin-frontend-general-01',
        title: '2024前端高频面试题之--VUE篇',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', '前端', '面试', 'Vue.js'],
        answer: [
          '【导读】本文总结了前端面试中经常问到的vue高频面试题，仅供参考。 下图为思维导图： 1.vue的生命周期有哪些及每个生命周期做了什么？ beforeCreate是new Vue()之后触发的第一个钩'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/7343484473184698405',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-frontend-general-02',
        title: '2025前端面试题-Vue3进阶篇',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', '前端', '面试', 'Vue.js'],
        answer: [
          '前端面试题-Vue3进阶篇 以下为Vue3面试进阶篇考察点总结，具体知识点不会太详细，主要梳理面试核心考察点，为面试做准备。'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/7511568225987051555',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  },
  {
    key: 'generated-juejin-vue',
    title: '自动采集 / 掘金 Vue',
    desc: '来自掘金搜索接口的 Vue 面试题文章',
    questions: [
      {
        id: 'juejin-vue-search-02',
        title: 'vue3面试题八股集合——2023',
        level: '中级',
        tags: ['自动采集', '掘金', 'Vue', '前端'],
        answer: [
          'vue3面试题八股集合——2023。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。'
        ],
        sourceName: '掘金 Vue 面试题',
        sourceUrl: 'https://juejin.cn/post/7227453567686033468',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-vue-search-04',
        title:
          '30 道 Vue 面试题，内含详细讲解（涵盖入门到精通，自测 Vue 掌握程度）',
        level: '中级',
        tags: ['自动采集', '掘金', 'Vue', '面试', 'Vue.js'],
        answer: [
          '本文以前端面试官的角度出发，对 Vue 框架中一些重要的特性、框架的原理以问题的形式进行整理汇总，意在帮助作者及读者自测下 Vue 掌握的程度。本文章节结构以从易到难进行组织，建议读者按章节顺序进行阅读，当然大佬级别的请随意。希望读者读完本文，有一定的启发思考，也能对自己的 V…'
        ],
        sourceName: '掘金 Vue 面试题',
        sourceUrl: 'https://juejin.cn/post/6844903918753808398',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-vue-search-05',
        title: '字节面试题：请你谈谈vue的响应式原理（一）（万字修改版）',
        level: '中级',
        tags: ['自动采集', '掘金', 'Vue', '前端', 'Vue.js', '面试'],
        answer: [
          '在之前写到的字节面试中，有一道题堪称经典中的经典，那就是vue的响应式原理。在这篇文章中我为各位详细解释了一下vue3中reactive的原理及简化版的代码。'
        ],
        sourceName: '掘金 Vue 面试题',
        sourceUrl: 'https://juejin.cn/post/7424903896802033675',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-vue-search-06',
        title: '历时一个月，2.6W字！50+Vue经典面试题源码级详解，你值得收藏！',
        level: '中级',
        tags: ['自动采集', '掘金', 'Vue', '前端', '面试', 'Vue.js'],
        answer: [
          '这是村长整整花了一个月时间收集题目，亲自手写答案，录制讲解视频，汇集了50+以上经典的Vue面试题，每题我都力争做到源码级的解析，希望大家可以深入学习，如果你喜欢请务必点赞、收藏、留言支持我~'
        ],
        sourceName: '掘金 Vue 面试题',
        sourceUrl: 'https://juejin.cn/post/7097067108663558151',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-vue-search-07',
        title: '「面试题」20+Vue面试题整理',
        level: '中级',
        tags: ['自动采集', '掘金', 'Vue', 'Vue.js', '面试'],
        answer: [
          '本文已收录在Github github.com/Geekhyt，欢迎Star。 从镜片的厚度和黄黑相见的格子衬衫我察觉到，面前坐着的这位面试官应该是来者不善。我像以往一样，准备花3分钟的时间进行自我介绍。在此期间，为了避免尴尬，我盯着面试官的眉毛中间，不过面试官明显对我的经历不…'
        ],
        sourceName: '掘金 Vue 面试题',
        sourceUrl: 'https://juejin.cn/post/6844904084374290446',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-vue-search-08',
        title:
          '🐮化身面试官出30+Vue面试题，超级干货（附答案）｜牛气冲天新年征文',
        level: '中级',
        tags: ['自动采集', '掘金', 'Vue', '面试'],
        answer: [
          '。。。 在你自我介绍的时候呢，我就看看你做过的项目，技术栈什么的。 Vue 借鉴了 angular 的模板和数据绑定技术，又借鉴了 react 的组件化和虚拟 DOM 技术。 特点： MVVM 模式',
          '代码简洁体积小，运行效率高，适合移动PC端开发',
          '本身只关注 UI （和 rea…'
        ],
        sourceName: '掘金 Vue 面试题',
        sourceUrl: 'https://juejin.cn/post/6930897845369356295',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  }
]

export const generatedReactSections: InterviewSection[] = [
  {
    key: 'generated-baidu-developer-foundation-react',
    title: '自动采集 / 百度开发者中心 / React',
    desc: '来自百度开发者中心文章页的前端面试题（按标题关键词分流）',
    questions: [
      {
        id: 'baidu-developer-frontend-200-10',
        title: '请谈谈你对 React 的理解及其核心特性？',
        level: '中级',
        tags: ['自动采集', '百度开发者'],
        answer: [
          'React 是一个用于构建用户界面的 JavaScript 库，它鼓励使用组件化的开发模式。React 的核心特性包括 JSX 语法、虚拟 DOM、组件化、状态管理（通过 state 和 props）等。它使得开发者能够高效地构建复杂且响应式的用户界面。'
        ],
        sourceName: '百度开发者中心前端面试题',
        sourceUrl: 'https://developer.baidu.com/article/details/3323986',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  },
  {
    key: 'generated-juejin-general-foundation-react',
    title: '自动采集 / 掘金通用题 / React',
    desc: '来自掘金搜索接口的前端通用面试题文章（按标题关键词分流）',
    questions: [
      {
        id: 'juejin-frontend-general-07',
        title: '2024前端高频面试题之-- react篇',
        level: '中级',
        tags: ['自动采集', '掘金', '通用题', 'React.js', '前端', '面试'],
        answer: [
          '【前端面试复习系列文章】 2024前端高频面试题-- html篇 2024前端高频面试题-- CSS篇 2024前端高频面试题-- JS篇 2024前端高频面试题-- VUE篇 【导读】本文总结了前端'
        ],
        sourceName: '掘金前端通用面试题',
        sourceUrl: 'https://juejin.cn/post/7349971654590857216',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  },
  {
    key: 'generated-juejin-react',
    title: '自动采集 / 掘金 React',
    desc: '来自掘金搜索接口的 React 面试题文章',
    questions: [
      {
        id: 'juejin-react-search-01',
        title: '一文带你梳理React面试题（2023年版本）',
        level: '中级',
        tags: ['自动采集', '掘金', 'React', 'React.js', '面试'],
        answer: [
          '源码分析：手把手带你复习react（包含react18版本） 一、react18有哪些更新？ 1. setState自动批处理 在react17中，只有react事件会进行批处理，原生js事件'
        ],
        sourceName: '掘金 React 面试题',
        sourceUrl: 'https://juejin.cn/post/7182382408807743548',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-react-search-02',
        title: '2025前端面试题-React基础篇',
        level: '中级',
        tags: ['自动采集', '掘金', 'React', '前端', '面试'],
        answer: [
          '前端面试题-React基础篇 以下为React面试基础考察点总结，具体知识点不会太详细，主要梳理面试核心考察点，为面试做准备。'
        ],
        sourceName: '掘金 React 面试题',
        sourceUrl: 'https://juejin.cn/post/7503811658198286388',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-react-search-04',
        title: '2025前端面试题-React进阶篇',
        level: '中级',
        tags: ['自动采集', '掘金', 'React', '前端', '面试'],
        answer: [
          '前端面试题-React进阶篇 以下为React面试进阶篇考察点总结，具体知识点不会太详细，主要梳理面试核心考察点，为面试做准备。'
        ],
        sourceName: '掘金 React 面试题',
        sourceUrl: 'https://juejin.cn/post/7504545616841965583',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-react-search-05',
        title: '2026 最新 React 面试题🔥',
        level: '中级',
        tags: ['自动采集', '掘金', 'React', '前端', 'React.js', '面试'],
        answer: [
          '年最新 React 面试题集锦，不废话，直接上干货！本文会进行不间断的迭代更新，如有错误之处，还望大家指出！'
        ],
        sourceName: '掘金 React 面试题',
        sourceUrl: 'https://juejin.cn/post/7348651815759282226',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-react-search-06',
        title: '2019年17道高频React面试题及详解',
        level: '中级',
        tags: ['自动采集', '掘金', 'React', '面试', 'React.js'],
        answer: [
          '以下面试题来源于github项目前端面试指南,那里有超过200道高频前端面试题及答案,目前拥有1400star. 组件化: 其中以 React 的组件化最为彻底,甚至可以到函数级别的原子组件,高度的组件化可以是我们的工程易于维护、易于组合拓展。 天然分层: JQuery 时代的…'
        ],
        sourceName: '掘金 React 面试题',
        sourceUrl: 'https://juejin.cn/post/6844903922453200904',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-react-search-07',
        title: '【前端面试题】2023年前端面试真题之React篇',
        level: '中级',
        tags: ['自动采集', '掘金', 'React', '前端', '面试', 'JavaScript'],
        answer: [
          '大家好，我是江辰，在如今的互联网大环境下，想必大家都或多或少且有感受，浮躁的社会之下，只有不断的保持心性，才能感知不同的收获，互勉。 2023年最新的面试题集锦，时刻做好准备。 本文首发于微信公众号：'
        ],
        sourceName: '掘金 React 面试题',
        sourceUrl: 'https://juejin.cn/post/7280439887962144820',
        syncedAt: '2026-05-09T01:38:45.973Z'
      },
      {
        id: 'juejin-react-search-08',
        title: '必须要会的 50 个 React 面试题',
        level: '中级',
        tags: ['自动采集', '掘金', 'React', 'React.js'],
        answer: [
          '如果你是一位有抱负的前端程序员并准备面试，那么这篇文章很适合你。本文是你学习和面试 React 所需知识的完美指南。 JavaScript 工具缓慢而稳定地在市场中扎根，对 React 的需求呈指数级增长。选择合适的技术来开发应用或网站变得越来越有挑战性。其中 React 被认…'
        ],
        sourceName: '掘金 React 面试题',
        sourceUrl: 'https://juejin.cn/post/6844903806715559943',
        syncedAt: '2026-05-09T01:38:45.973Z'
      }
    ]
  }
]

export const generatedQuestionBankMeta = {
  generatedAt: '2026-05-09T01:38:45.973Z',
  sourceCount: 5,
  questionCount: 41
}
