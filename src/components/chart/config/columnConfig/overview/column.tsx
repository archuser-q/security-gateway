export const config = {
    xField: 'type',
    yField: 'value',
    colorField: 'type',
    legend: false,
    tooltip: {
      title: 'type',
      items: [{ channel: 'y', name: 'Count' }],
    },
    style: {
      radiusTopLeft: 8,
      radiusTopRight: 8,
    },
    axis: {
      x: {
        title: false,
        tick: true,
        label: {
          style: {
            fontSize: 12,
          },
        },
      },
      y: {
        title: false,
        grid: true,
        label: {
          style: {
            fontSize: 12,
          },
        },
      },
    },
};