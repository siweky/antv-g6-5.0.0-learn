<template>
  <div id="graphinInstance" ref="graphinContainer">
    graphin
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Graph, extend, Extensions } from '@antv/g6';
import Algorithm from '@antv/algorithm';
import type { IGraph, GraphData } from '@antv/g6/lib/types';


const graphinContainer = ref<HTMLElement>();
const graph = ref<any>();
const initData = ref<GraphData>({
  // 点集
  nodes: [
    {
      id: 'node0',            // 元素的 id
      data: {
        x: 100,               // 节点位置，若 graph 未配置 layout，且数据中所有的节点数据都有 x y 信息，则使用该信息绘制节点位置
        y: 100,
        type: 'circle-node',  // 元素的图形。相比于 v4 多了 -node 后缀     circle-node | rect-node | triangle-node
        label: 'node0',        // 标签文字
        keyShape: {           // 主图形的样式属性
          r: 20,               // 主图形的大小，如果是 rect-node 则是 width、height 控制
          fill: '#000',       // 主图形的填充色
          stroke: '#888',     // 主图形的描边色
          endArrow: {
            path: 'M 0,0 L 8,4 L 8,-4 Z',  // 箭头的路径，默认为一个三角形
            fill: '#000'       // 箭头的填充色
          }
          // ...              // 主图形的其他样式属性
        },
        labelShape: {
          positions: 'center',  // 标签的属性，标签在元素中的位置
          text: 'node-xxx-label',// 元素标签的文本，若不配置则使用 data.label 填充
          fontSize: 12          // 标签的样式属性，文字字体大小
          // ...                // 标签的其他样式属性
        },
        iconShape: {
          x: 0,                 // 元素图标在元素中的位置，相对于元素中心点的 x 轴偏移量
          y: 0,                 // 元素图标在元素中的位置，相对于元素中心点的 y 轴偏移量
          width: 20,            // 元素图标的宽
          height: 20,           // 元素图标的高
          img: 'xxx.png',       // 元素图标的图片地址
          // ...                // 元素图标的其他样式属性
        },
        badgeShapes: {
          x: 0,                 // 元素徽标在元素中的位置，相对于元素中心点的 x 轴偏移量
          y: 0,                 // 元素徽标在元素中的位置，相对于元素中心点的 y 轴偏移量
          r: 20,                // 元素徽标的大小，如果为 circle-node 则表示徽标的大小，否则表示徽标边长的一半
          fill: '#000',       // 元素徽标的填充色
          stroke: '#888',     // 元素徽标的描边色
        }
        // ...,               // 其他属性
      },
    },
    {
      id: 'node1',
      data: {
        x: 300,
        y: 100,
        type: 'rect-node',
        label: 'node2',
        keyShape: {
          r: 20,
          fill: '#000',
          stroke: '#888',
        },
        labelShape: {
          positions: 'center',
          text: 'node-xxx-label',
          fontSize: 12,
        }
      }
    },
  ],
  // 边集
  edges: [
    // 表示一条从 node1 节点连接到 node2 节点的边
    {
      id: 'edge0-1',
      source: 'node0',
      target: 'node1',
      data: {
        type: 'line-edge',
        keyShape: {
          opacity: 0.6, // 边主图形的透明度
          stroke: 'grey', // 边主图形描边颜色
        },
        // 边上的标签文本配置
        labelShape: {
          autoRotate: true, // 边上的标签文本根据边的方向旋转
        },
        // 边的动画配置
        animates: {
          // 数据/状态更新时
          update: [{
            shapeId: 'haloShape', // 背景光晕图形
            states: ['selected', 'active'], // 在 selected 和 active 状态变更时
            fields: ['opacity'],  // 在透明度变化时，带动画地变化
          }, {
            shapeId: 'keyShape', // 主图形
            states: ['selected', 'active'], // 在 selected 和 active 状态变更时
            fields: ['lineWidth'], // 在描述边粗细变化时，带动画地变化
          }]
        }
      }
    },
  ],
});
// 自定义数据处理器 - 度数计算
const degreeCalculator = (data: any, options: any, userGraphCore: any) => {
  const degreeMap = new Map();
  data.dataAdded.edges.forEach(({ source, target }: any) => {
    degreeMap.set(source, (degreeMap.get(source) || 0) + 1);
    degreeMap.set(target, (degreeMap.get(target) || 0) + 1);
  });
  data.dataAdded.nodes.forEach((node: any) => {
    node.data.degree = degreeMap.get(node.id) || 0;
  });
  console.log('degreeMap-----', degreeMap)
  return data;
};
// 自定义数据处理器 - 节点聚类
const clusteringNodes = (data: any, options: any, userGraphCore: any) => {
  if (!Algorithm?.labelPropagation) return;
  const clusteredData = Algorithm.louvain(data.dataAdded, false);
  const clusterMap = new Map();
  clusteredData.clusters.forEach((cluster, i) => {
    cluster.nodes.forEach((node) => {
      clusterMap.set(node.id, `c${i}`);
    });
  });
  data.dataAdded.nodes.forEach((node: any) => {
    node.data.cluster = clusterMap.get(node.id);
  });
  return data;
};
const ExtGraph: any = extend(Graph, {
  transforms: {
    'degree-calculator': degreeCalculator,
    'node-clustering': clusteringNodes,
  },
  behaviors: {
    "brush-select": Extensions.BrushSelect
  },
  nodes: {
    // 需要注意，为包体积管理，G6 只默认注册了 circle-node 和 rect-node，其他内置或自定义节点类型需要从 Extensions 引入并通过如下方式注册
    'triangle-node': Extensions.TriangleNode,
  },
  plugins: {
    minimap: Extensions.Minimap,
    tooltip: Extensions.Tooltip
  }
});
const tooltip = {
  key: "my-tooltip",
  type: "tooltip",
  itemTypes: ["node"],
  getContent: (e: any) => {
    const model = graph.value.getNodeData(e.itemId);
    return `ID: ${e.itemId}<br/>Degree: ${model?.data.degree}`;
  }
};
const initGraphin = () => {

  // const ExtGraph = extend(BaseGraph, {});
  graph.value = new ExtGraph({
    // 注意这里使用的是 extend 返回的 Graph
    container: graphinContainer.value,
    width: 800,
    height: 300,
    // ... 其他 graph 配置
    transforms: [
      'transform-v4-data', // 内置提供的转换器，将 v4 格式数据转换为 v5 格式
      'degree-calculator', // 自定义的数据处理器，计算节点的度数存储到 data.degree 中
      'node-clustering', // 自定义的数据处理器，将聚类结果存储到节点的 data.cluster 字段上，方便后续主题模块使用
      {
        // 内置提供的节点大小映射器，将 field 指定的字段（这里指定了上一个处理器产生的 degree 字段）的值，映射到节点大小上，节点大小归一化到 16 ～ 60
        type: 'map-node-size',
        field: 'degree',
        range: [16, 60],
      },
    ],
    modes: {
      default: [
        "drag-node",
        "drag-canvas",
        "zoom-canvas",
        "click-select",
        "brush-select"
      ]
    },
    plugins: ['minimap', tooltip],
    layout: {
      type: 'force', // 指定为力导向布局
      preventOverlap: true, // 防止节点重叠
      linkDistance: 50, // 边的理想长度
      // nodeSize: 30     // 节点大小，用于算法中防止节点重叠时的碰撞检测。默认将使用数据中的节点大小。
    },
    // 主题配置
    theme: {
      type: 'spec',
      base: 'light', // 白色主题
      specification: {
        node: {
          // 节点颜色映射 data.cluster 字段
          dataTypeField: 'cluster',
        },
      },
    },
    node: (model: any) => {
      // model 是该节点用户输入数据，在 transform 作用后的、在 G6 内部流转的数据
      const { id, data } = model;
      // 根据数据中的 degree 字段，使用不同的节点类型
      let type = 'circle-node';
      if (data.degree === 2) type = 'rect-node';
      else if (data.degree === 1) type = 'triangle-node';

      // 徽标图形
      const badgeShapes: any = {
        fontSize: 12,
        lod: 0,
      };
      // 根据 degree 字段，增加不同的徽标
      if (data.degree > 10) {
        badgeShapes[0] = {
          color: '#F86254',
          text: 'Important',
          position: 'rightTop',
        };
      }
      if (data.degree > 5) {
        badgeShapes[1] = {
          text: 'A',
          textAlign: 'center',
          color: '#EDB74B',
          position: 'right',
        };
      }

      return {
        id,
        data: {
          // 注意必须复制 data 到此处，否则可能丢失数据中的其他属性
          ...data,
          type,
          // 文本图形样式
          labelShape: {
            position: 'bottom',
            text: id,
          },
          // 文本背景样式，不为 undefined 就代表在有文本时，出现背景图形。其中还可以配置更多的样式属性，例如 fill 填充色、padding 等
          labelBackgroundShape: {},
          // icon 图形，degree < 2 的节点不展示 icon
          iconShape:
            data.degree <= 2
              ? undefined
              : {
                img: 'https://gw.alipayobjects.com/zos/basement_prod/012bcf4f-423b-4922-8c24-32a89f8c41ce.svg',
                fill: '#fff',
                lod: 0,
                fontSize: data.keyShape.r - 4,
              },
          // 徽标图形
          badgeShapes,
          // 动画配置
          animates: {
            update: [
              {
                fields: ['opacity'],
                shapeId: 'haloShape',
                states: ['selected', 'active'],
              },
              {
                fields: ['lineWidth'],
                shapeId: 'keyShape',
                states: ['selected', 'active'],
              },
            ],
          },
        },
      };
    },
    edge: {
      animates: {
        update: [
          {
            fields: ['opacity'],
            shapeId: 'haloShape',
            states: ['selected', 'active'],
          },
          {
            fields: ['lineWidth'],
            shapeId: 'keyShape',
            states: ['selected', 'active'],
          },
        ],
      },
    },
  });
  main();
}

const main = async () => {
  const response = await fetch('/static/data.json');
  const remoteData = await response.json();
  initData.value = remoteData;
  graph.value.read(initData.value);
};
onMounted(() => {
  console.log('onMounted')
  initGraphin();
})
</script>

<style scoped>

</style>