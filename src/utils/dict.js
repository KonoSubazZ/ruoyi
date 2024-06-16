import useDictStore from '@/store/modules/dict'
import { getDicts } from '@/api/system/dict/data'

/**
 * 获取字典数据
 */
export function useDict(...args) {
  const res = ref({});
  return (() => {
    args.forEach((dictType, index) => {
      res.value[dictType] = [];
      const dicts = useDictStore().getDict(dictType);
      if (dicts) {
        res.value[dictType] = dicts;
      } else {
        getDicts(dictType).then(resp => {
          res.value[dictType] = resp.data.map(p => ({ label: p.dictLabel, value: p.dictValue, elTagType: p.listClass, elTagClass: p.cssClass }))
          useDictStore().setDict(dictType, res.value[dictType]);
        })
      }
    })

    /*
     * 这里为什么用toRefs呢？
     * const {a, b} = ref({a: 1, b: 2})
     * 此时这样是无效的：ref的返回值是一个普通的ref对象，而不是响应式对象， 不能直接使用解构
     * 正确的用法是：
     * const res = ref({a: 1, b: 2})
     * const {a, b} = res.value
     * 使用toRefs可以将ref对象转换为响应式对象
     * 使用toRefs后，res.value是普通对象，可以直接使用a, b
     * const {a, b} = toRefs(res.value)
     * 使用toRefs后，a, b 是ref类型，而不是普通对象
     * 使用toRefs后，可以直接使用a.value, b.value获取值
     * 使用toRefs后，不能直接使用a, b赋值，需要使用a.value = 1, b.value = 2

    */
    return toRefs(res.value);
  })()
}