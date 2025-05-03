import React from 'react';
import { Dimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from 'twrnc';

export default function Trapezium({ styles, color = 'black', width = 50, height = 20, radius = 20 }) {
  // Calculate 50vmin × 20vmin
  const { width: SW, height: SH } = Dimensions.get('window');
  const vmin = Math.min(SW, SH) / 100;
  const W = width * vmin;
  const H = height * vmin;

  // even bigger corner radius
  const r = radius;
  // bottom now 90% of top width
  const x1 = 0.05 * W;
  const x2 = 0.95 * W;

  // Path with smooth Q curves at each corner
  const d = `
    M ${r},0
    L ${W - r},0
    Q ${W},0 ${W},${r}
    L ${x2},${H - r}
    Q ${x2},${H} ${x2 - r},${H}
    L ${x1 + r},${H}
    Q ${x1},${H} ${x1},${H - r}
    L 0,${r}
    Q 0,0 ${r},0
    Z
  `;

  return (
    <View style={[tw`left-[-20] top-[-7]`, styles]}>
      <Svg width={W} height={H}>
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
}
