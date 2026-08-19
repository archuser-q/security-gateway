export interface NodeValue {
  title: string
  items: { text: string; value?: string }[]
}

export interface Node {
  [key: string]: any
  id: string
  value: NodeValue
}

export interface Edge {
  [key: string]: any
  source: string
  target: string
  value?: string
}
