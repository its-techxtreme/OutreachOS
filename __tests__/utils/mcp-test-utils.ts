/**
 * MCP Integration Testing Utilities
 * Helper functions for testing Google Stitch MCP and ui-ux-pro-max skill integration
 */

/**
 * Mock Stitch design generation response
 */
export const mockStitchDesign = {
  id: 'test-design-123',
  name: 'GlobalMetricsPanel',
  designTokens: {
    colors: {
      background: 'zinc-950',
      surface: 'zinc-900',
      accent: 'indigo-600',
      text: 'zinc-100'
    },
    spacing: {
      container: 'p-6',
      cards: 'gap-4',
      internal: 'p-4'
    },
    typography: {
      heading: 'text-lg font-semibold',
      metric: 'text-2xl font-bold tabular-nums',
      label: 'text-sm text-zinc-400'
    }
  },
  components: [
    {
      name: 'MetricCard',
      props: ['title', 'value', 'change'],
      styling: 'bg-zinc-900 rounded-lg p-4 border border-zinc-800'
    }
  ],
  responsive: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'grid-cols-3'
  }
};

/**
 * Mock UI-UX-Pro-Max skill response
 */
export const mockUiUxProMaxResponse = {
  componentCode: `
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
}

export function MetricCard({ title, value, change }: MetricCardProps) {
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <h3 className="text-sm text-zinc-400 mb-2">{title}</h3>
      <div className="text-2xl font-bold tabular-nums text-zinc-100">{value}</div>
      {change && (
        <div className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
  );
}`,
  tests: `
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Test Metric" value="100" />);
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});`,
  accessibility: {
    ariaLabels: ['title', 'value'],
    contrastRatio: 4.5,
    keyboardNavigation: true
  }
};

/**
 * Validate Stitch design output
 */
export function validateStitchDesign(design: any) {
  const requiredFields = ['designTokens', 'components', 'responsive'];
  const hasAllFields = requiredFields.every(field => field in design);
  
  if (!hasAllFields) {
    throw new Error(`Stitch design missing required fields: ${requiredFields.join(', ')}`);
  }
  
  // Validate design tokens
  const { colors, spacing, typography } = design.designTokens;
  if (!colors || !spacing || !typography) {
    throw new Error('Stitch design missing required design tokens');
  }
  
  // Validate color scheme matches requirements
  const requiredColors = ['background', 'surface', 'accent', 'text'];
  const hasRequiredColors = requiredColors.every(color => color in colors);
  if (!hasRequiredColors) {
    throw new Error(`Design tokens missing required colors: ${requiredColors.join(', ')}`);
  }
  
  return true;
}

/**
 * Validate UI-UX-Pro-Max component output
 */
export function validateUiUxProMaxOutput(output: any) {
  const requiredFields = ['componentCode', 'tests', 'accessibility'];
  const hasAllFields = requiredFields.every(field => field in output);
  
  if (!hasAllFields) {
    throw new Error(`UI-UX-Pro-Max output missing required fields: ${requiredFields.join(', ')}`);
  }
  
  // Validate component code contains TypeScript interfaces
  if (!output.componentCode.includes('interface') || !output.componentCode.includes('export')) {
    throw new Error('Component code must include TypeScript interfaces and exports');
  }
  
  // Validate tests are included
  if (!output.tests.includes('describe') || !output.tests.includes('it')) {
    throw new Error('Component tests must include Jest test structure');
  }
  
  // Validate accessibility requirements
  const { accessibility } = output;
  if (!accessibility.ariaLabels || !accessibility.contrastRatio || !accessibility.keyboardNavigation) {
    throw new Error('Accessibility requirements not met');
  }
  
  return true;
}

/**
 * Mock MCP skill invocation
 */
export async function mockStitchGeneration(componentName: string, specifications: any) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    ...mockStitchDesign,
    name: componentName,
    specifications
  };
}

/**
 * Mock UI-UX-Pro-Max skill invocation
 */
export async function mockUiUxProMaxGeneration(stitchDesign: any) {
  // Simulate component generation delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  return {
    ...mockUiUxProMaxResponse,
    componentName: stitchDesign.name,
    designTokens: stitchDesign.designTokens
  };
}

/**
 * Visual regression testing helper
 */
export function compareDesignToImplementation(stitchDesign: any, implementedComponent: any) {
  // Compare design tokens
  const designColors = stitchDesign.designTokens.colors;
  const implementedColors = extractColorsFromComponent(implementedComponent);
  
  const colorsMatch = Object.keys(designColors).every(colorKey => 
    implementedColors.includes(designColors[colorKey])
  );
  
  if (!colorsMatch) {
    throw new Error('Implemented component colors do not match Stitch design');
  }
  
  return {
    colorsMatch,
    spacingMatch: true, // Simplified for demo
    typographyMatch: true, // Simplified for demo
    overallAccuracy: colorsMatch ? 100 : 0
  };
}

/**
 * Helper to extract colors from component code
 */
function extractColorsFromComponent(componentCode: string): string[] {
  const colorRegex = /(zinc|indigo|green|red)-\d+/g;
  return componentCode.match(colorRegex) || [];
}

/**
 * Create MCP test fixtures
 */
export const mcpTestFixtures = {
  globalMetricsPanel: {
    stitch: mockStitchDesign,
    uiUxProMax: mockUiUxProMaxResponse
  },
  filterToolbar: {
    stitch: { ...mockStitchDesign, name: 'FilterToolbar' },
    uiUxProMax: { ...mockUiUxProMaxResponse, componentName: 'FilterToolbar' }
  },
  prospectMatrixTable: {
    stitch: { ...mockStitchDesign, name: 'ProspectMatrixTable' },
    uiUxProMax: { ...mockUiUxProMaxResponse, componentName: 'ProspectMatrixTable' }
  }
};