import { MindMap, type MindMapOptions } from '@ant-design/graphs';
import { mindmapData } from './config/mindmapConfig/data';

const Mindmap = () => {
  const data = mindmapData();
  const options: MindMapOptions = {
  autoFit: 'view',
  data,
  edge: {
    style: {
      endArrow: false,
      lineWidth: 2,
    },
  },
  direction: 'right',
  animation: false,
  node: {
    style: {
      size: (d: any) => {
        const textLength = d.id.length;
        return [Math.max(120, textLength * 8), 40];
      },
      ports: [{ placement: 'right' }, { placement: 'left' }],
    },
  },
  layout: {
    type: 'mindmap',
    getHeight: () => 50,
    getWidth: (d: any) => Math.max(1, d.id.length * 5),
  }
};
  return(
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
        Route Direction Overview
      </h2>
      <div style={{ height: '400px' }}>
        <MindMap {...options} />
      </div>
    </div>
  )
};

export default Mindmap