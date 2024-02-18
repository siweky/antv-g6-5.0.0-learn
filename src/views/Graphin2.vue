<template>
  <div id="container" />
</template>

<script setup >
import { ref, onMounted } from 'vue';
import { Graph, extend, Extensions } from "@antv/g6";
import Algorithm from "@antv/algorithm";
const graph = ref();
const initData = ref({
  nodes: [
    {
      id: '0',
      data: {
        // x: 100,               // 节点位置，若 graph 未配置 layout，且数据中所有的节点数据都有 x y 信息，则使用该信息绘制节点位置
        // y: 100,
        type: 'circle-node',  // 元素的图形。相比于 v4 多了 -node 后缀
        label: 'node0',        // 标签文字
        degree: 1,
        cluster: "c0",
        keyShape: {           // 主图形的样式属性
          r: 20,               // 主图形的大小，如果是 rect-node 则是 width、height 控制
          fill: '#000',       // 主图形的填充色
          stroke: '#888',     // 主图形的描边色
          // ...              // 主图形的其他样式属性
        },
        labelShape: {
          positions: 'center',  // 标签的属性，标签在元素中的位置
          text: 'node-xxx-label', // 元素标签的文本，若不配置则使用 data.label 填充
          fontSize: 12,          // 标签的样式属性，文字字体大小
          // ...                // 标签的其他样式属性
        }
        // ...,               // 其他属性
      },
    },
    { id: '1', data: { label: 'node1', degree: 3, cluster: "c4" } },
  ],
  edges: [
    { id: 'edge-0-1', source: '0', target: '1' }
  ]
});

const ExtGraph = extend(Graph, {
  behaviors: {
    "brush-select": Extensions.BrushSelect
  },
  nodes: {
    "triangle-node": Extensions.TriangleNode
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
  getContent: (e) => {
    const model = graph.value.getNodeData(e.itemId);
    return `ID: ${e.itemId}<br/>Degree: ${model.data.degree}`;
  }
};
const initGraph = () => {
  graph.value = new ExtGraph({
    container: document.getElementById('container'),
    width: 800,
    height: 500,
    transforms: [
      {
        type: "map-node-size",
        field: "degree",
        range: [16, 60]
      }
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
      type: "force",
      animated: true,
      linkDistance: 50
    },
    theme: {
      type: "spec",
      base: "light",
      specification: {
        node: {
          dataTypeField: "cluster"
        }
      }
    },
    node: (model) => {
      const { id, data } = model;
      return {
        id,
        data: {
          ...data,
          type: "circle-node",
          labelShape: {
            position: "bottom",
            text: id
          },
          labelBackgroundShape: {},
          iconShape: {
            img: "https://gw.alipayobjects.com/zos/basement_prod/012bcf4f-423b-4922-8c24-32a89f8c41ce.svg",
            fill: "#fff",
            lod: 0,
            fontSize: data.keyShape.r - 4
          },
          animates: {
            update: [
              {
                fields: ["opacity"],
                shapeId: "haloShape",
                states: ["selected", "active"]
              },
              {
                fields: ["lineWidth"],
                shapeId: "keyShape",
                states: ["selected", "active"]
              }
            ]
          }
        }
      };
    },
    edge: {
      animates: {
        update: [
          {
            fields: ["opacity"],
            shapeId: "haloShape",
            states: ["selected", "active"]
          },
          {
            fields: ["lineWidth"],
            shapeId: "keyShape",
            states: ["selected", "active"]
          }
        ]
      }
    }
  });
  // graph.value.read(initData.value);
  main();
};

const main = async () => {
  const response = await fetch('/static/data.json');
  const remoteData = await response.json();
  initData.value = remoteData;
  graph.value.read(initData.value);
};


onMounted(() => {
  console.log('onMounted')
  initGraph();

})
</script>

<style>
.g6-minimap-container {
  background-color: #fff;
  border: 1px solid #7e92b5;
  height: 115px;
}
</style>