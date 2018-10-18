module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  globals: {
    __static: true
  },
  plugins: [
    'html'
  ],
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,

    "no-unused-vars": [2, {
      // 允许声明未使用变量
      "vars": "local",
      // 参数不检查
      "args": "none"
    }],
    // 关闭语句强制分号结尾
    "semi": [0],
    //空行最多不能超过100行
    "no-multiple-empty-lines": [0, { "max": 100 }],
    //关闭禁止混用tab和空格
    "no-mixed-spaces-and-tabs": [0],
    // 忽略indent
    'indent': 0,
    //文件最后空一行
    "eol-last": 0,
    //引号类型 `` "" ''
    "quotes": 0,
    //对象字面量中的属性名是否强制双引号
    "quote-props": 0,
    //一行结束后面不要有空格
    "no-trailing-spaces": 0,
    //对象字面量中冒号的前后空格
    "key-spacing": 0,
    //中缀操作符周围要不要有空格
    "space-infix-ops": 0,
  }
}
