import { registerComponent } from './index'
import type { Registration } from './types'

const text: Registration = {
  type: 'text',
  labelKey: 'palette.text',
  defaultProps: { text: 'New text' },
  defaultStyles: {
    base: {
      fontSize: '16px',
      color: '#171717',
    },
  },
}

const image: Registration = {
  type: 'image',
  labelKey: 'palette.image',
  defaultProps: { src: '', alt: '' },
  defaultStyles: {
    base: {
      maxWidth: '320px',
      width: '100%',
    },
  },
}

const button: Registration = {
  type: 'button',
  labelKey: 'palette.button',
  defaultProps: { label: 'Button' },
  defaultStyles: {
    base: {
      padding: '8px 12px',
      borderRadius: '8px',
      background: '#3B82F6',
      color: '#ffffff',
      border: 'none',
    },
  },
}

const container: Registration = {
  type: 'container',
  labelKey: 'palette.container',
  defaultProps: {},
  defaultStyles: {
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px',
      border: '1px dashed #d4d4d8',
      borderRadius: '8px',
      minHeight: '80px',
    },
  },
}

export function registerDefaultComponents() {
  registerComponent(text)
  registerComponent(image)
  registerComponent(button)
  registerComponent(container)
}
