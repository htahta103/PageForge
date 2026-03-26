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

const input: Registration = {
  type: 'input',
  labelKey: 'palette.input',
  defaultProps: { placeholder: 'Email', name: '', inputType: 'text' },
  defaultStyles: {
    base: {
      padding: '10px 12px',
      borderRadius: '10px',
      border: '1px solid #e5e5e5',
      width: '100%',
      maxWidth: '360px',
    },
  },
}

const card: Registration = {
  type: 'card',
  labelKey: 'palette.card',
  defaultProps: { title: 'Card' },
  defaultStyles: {
    base: {
      padding: '16px',
      borderRadius: '14px',
      border: '1px solid #e5e5e5',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      minHeight: '80px',
    },
  },
}

const nav: Registration = {
  type: 'nav',
  labelKey: 'palette.nav',
  defaultProps: { brand: 'Brand' },
  defaultStyles: {
    base: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '12px 14px',
      borderRadius: '12px',
      border: '1px solid #e5e5e5',
      background: '#ffffff',
      minHeight: '52px',
    },
  },
}

const list: Registration = {
  type: 'list',
  labelKey: 'palette.list',
  defaultProps: { ordered: false },
  defaultStyles: {
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '0px',
      margin: '0px',
    },
  },
}

const icon: Registration = {
  type: 'icon',
  labelKey: 'palette.icon',
  defaultProps: { glyph: '★', ariaLabel: '' },
  defaultStyles: {
    base: {
      fontSize: '18px',
      color: '#171717',
      lineHeight: '1',
    },
  },
}

const divider: Registration = {
  type: 'divider',
  labelKey: 'palette.divider',
  defaultProps: {},
  defaultStyles: {
    base: {
      borderTop: '1px solid #e5e5e5',
      width: '100%',
      margin: '12px 0px',
    },
  },
}

const spacer: Registration = {
  type: 'spacer',
  labelKey: 'palette.spacer',
  defaultProps: { height: 24 },
  defaultStyles: {
    base: {
      height: '24px',
      width: '100%',
    },
  },
}

const video: Registration = {
  type: 'video',
  labelKey: 'palette.video',
  defaultProps: { src: '', poster: '' },
  defaultStyles: {
    base: {
      width: '100%',
      maxWidth: '560px',
      borderRadius: '12px',
      background: '#0a0a0a',
    },
  },
}

const customHtml: Registration = {
  type: 'custom-html',
  labelKey: 'palette.customHtml',
  defaultProps: { html: '<div>Hello</div>', ariaLabel: '' },
  defaultStyles: {
    base: {
      padding: '12px',
      borderRadius: '12px',
      border: '1px dashed #d4d4d8',
      background: '#fafafa',
    },
  },
}

export function registerDefaultComponents() {
  registerComponent(text)
  registerComponent(image)
  registerComponent(button)
  registerComponent(container)
  registerComponent(input)
  registerComponent(card)
  registerComponent(nav)
  registerComponent(list)
  registerComponent(icon)
  registerComponent(divider)
  registerComponent(spacer)
  registerComponent(video)
  registerComponent(customHtml)
}
