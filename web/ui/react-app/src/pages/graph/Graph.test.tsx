import * as React from 'react';
import $ from 'jquery';
import { shallow, mount } from 'enzyme';
import Graph from './Graph';
import ReactResizeDetector from 'react-resize-detector';
import { Legend } from './Legend';
import { GraphDisplayMode } from './Panel';

describe('Graph', () => {
  beforeAll(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => cb());
  });

  // Source: https://github.com/maslianok/react-resize-detector#testing-with-enzyme-and-jest
  beforeEach(() => {
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    window.ResizeObserver = ResizeObserver;
  });

  describe('data is returned', () => {
    const props: any = {
      queryParams: {
        startTime: 1572128592,
        endTime: 1572130692,
        resolution: 28,
      },
      displayMode: GraphDisplayMode.Stacked,
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: {
              code: '200',
              handler: '/graph',
              instance: 'localhost:9090',
              job: 'prometheus',
            },
            values: [
              [1572128592, '23'],
              [1572128620, '2'],
              [1572128648, '4'],
              [1572128676, '1'],
              [1572128704, '2'],
              [1572128732, '12'],
              [1572128760, '1'],
              [1572128788, '0'],
              [1572128816, '0'],
              [1572128844, '2'],
              [1572128872, '5'],
              [1572130384, '6'],
              [1572130412, '7'],
              [1572130440, '19'],
              [1572130468, '33'],
              [1572130496, '14'],
              [1572130524, '7'],
              [1572130552, '6'],
              [1572130580, '0'],
              [1572130608, '0'],
              [1572130636, '0'],
              [1572130664, '0'],
              [1572130692, '0'],
            ],
          },
        ],
        exemplars: [
          {
            seriesLabels: {
              code: '200',
              handler: '/graph',
              instance: 'localhost:9090',
              job: 'prometheus',
            },
            exemplars: [
              {
                labels: {
                  traceID: '12345',
                },
                timestamp: 1572130580,
                value: '9',
              },
            ],
          },
        ],
      },
      id: 'test',
    };
    it('renders a graph with props', () => {
      const graph = shallow(<Graph {...props} />);
      const div = graph.find('div').filterWhere((elem) => elem.prop('className') === 'graph-test');
      const resize = div.find(ReactResizeDetector);
      const innerdiv = div.find('div').filterWhere((elem) => elem.prop('className') === 'graph-chart');
      expect(resize.prop('handleWidth')).toBe(true);
      expect(div).toHaveLength(1);
      expect(innerdiv).toHaveLength(1);
    });
    describe('Legend', () => {
      it('renders a legend', () => {
        const graph = shallow(<Graph {...props} />);
        expect(graph.find(Legend)).toHaveLength(1);
      });
    });
  });
  describe('on component update', () => {
    let graph: any;
    let spyState: any;
    let mockPlot: any;
    beforeEach(() => {
      mockPlot = jest.spyOn($, 'plot').mockReturnValue({ setData: jest.fn(), draw: jest.fn(), destroy: jest.fn() } as any);
      graph = mount(
        <Graph
          {...({
            displayMode: GraphDisplayMode.Stacked,
            queryParams: {
              startTime: 1572128592,
              endTime: 1572128598,
              resolution: 28,
            },
            data: { result: [{ values: [], metric: {} }] },
          } as any)}
        />
      );
      spyState = jest.spyOn(graph.instance(), 'setState');
    });
    afterEach(() => {
      spyState.mockReset();
      mockPlot.mockReset();
    });
    it('should trigger state update when new data is received', () => {
      graph.setProps({ data: { result: [{ values: [{}], metric: {} }] } });
      expect(spyState).toHaveBeenCalledWith(
        {
          chartData: {
            exemplars: [],
            series: [
              {
                color: '#008000',
                data: [[1572128592000, null]],
                index: 0,
                labels: {},
                stack: true,
              },
            ],
          },
        },
        expect.anything()
      );
    });
    it('should trigger state update when stacked prop is changed', () => {
      graph.setProps({ displayMode: GraphDisplayMode.Lines });
      expect(spyState).toHaveBeenCalledWith(
        {
          chartData: {
            exemplars: [],
            series: [
              {
                color: '#008000',
                data: [[1572128592000, null]],
                index: 0,
                labels: {},
                stack: false,
              },
            ],
          },
        },
        expect.anything()
      );
    });
  });
  describe('on unmount', () => {
    it('should call destroy plot', () => {
      const graph = mount(
        <Graph
          {...({
            displayMode: GraphDisplayMode.Stacked,
            queryParams: {
              startTime: 1572128592,
              endTime: 1572130692,
              resolution: 28,
            },
            data: { result: [{ values: [], metric: {} }] },
          } as any)}
        />
      );
      const spyPlotDestroy = jest.spyOn(graph.instance(), 'componentWillUnmount');
      graph.unmount();
      expect(spyPlotDestroy).toHaveBeenCalledTimes(1);
      spyPlotDestroy.mockReset();
    });
  });

  describe('plot', () => {
    it('should not call jquery.plot if chartRef not exist', () => {
      const mockSetData = jest.fn();
      jest.spyOn($, 'plot').mockReturnValue({ setData: mockSetData, draw: jest.fn(), destroy: jest.fn() } as any);
      const graph = shallow(
        <Graph
          {...({
            displayMode: GraphDisplayMode.Stacked,
            queryParams: {
              startTime: 1572128592,
              endTime: 1572128598,
              resolution: 28,
            },
            data: { result: [{ values: [], metric: {} }] },
          } as any)}
        />
      );
      (graph.instance() as any).plot();
      expect(mockSetData).not.toBeCalled();
    });
    it('should call jquery.plot if chartRef exist', () => {
      const mockPlot = jest
        .spyOn($, 'plot')
        .mockReturnValue({ setData: jest.fn(), draw: jest.fn(), destroy: jest.fn() } as any);
      const graph = mount(
        <Graph
          {...({
            displayMode: GraphDisplayMode.Stacked,
            queryParams: {
              startTime: 1572128592,
              endTime: 1572128598,
              resolution: 28,
            },
            data: { result: [{ values: [], metric: {} }] },
          } as any)}
        />
      );
      (graph.instance() as any).plot();
      expect(mockPlot).toBeCalled();
    });
    it('should destroy plot', () => {
      const mockDestroy = jest.fn();
      jest.spyOn($, 'plot').mockReturnValue({ setData: jest.fn(), draw: jest.fn(), destroy: mockDestroy } as any);
      const graph = mount(
        <Graph
          {...({
            displayMode: GraphDisplayMode.Stacked,
            queryParams: {
              startTime: 1572128592,
              endTime: 1572128598,
              resolution: 28,
            },
            data: { result: [{ values: [], metric: {} }] },
          } as any)}
        />
      );
      (graph.instance() as any).plot();
      (graph.instance() as any).destroyPlot();
      expect(mockDestroy).toHaveBeenCalledTimes(2);
    });
  });
  describe('plotSetAndDraw', () => {
    it('should call spyPlotSetAndDraw on legend hover', () => {
      jest.spyOn($, 'plot').mockReturnValue({ setData: jest.fn(), draw: jest.fn(), destroy: jest.fn() } as any);
      const graph = mount(
        <Graph
          {...({
            displayMode: GraphDisplayMode.Stacked,
            queryParams: {
              startTime: 1572128592,
              endTime: 1572128598,
              resolution: 28,
            },
            data: {
              result: [
                { values: [], metric: {} },
                { values: [], metric: {} },
              ],
            },
          } as any)}
        />
      );
      (graph.instance() as any).plot(); // create chart
      const spyPlotSetAndDraw = jest.spyOn(graph.instance() as any, 'plotSetAndDraw');
      graph.find('.legend-item').at(0).simulate('mouseover');
      expect(spyPlotSetAndDraw).toHaveBeenCalledTimes(1);
    });
    it('should call spyPlotSetAndDraw with chartDate from state as default value', () => {
      const mockSetData = jest.fn();
      const spyPlot = jest
        .spyOn($, 'plot')
        .mockReturnValue({ setData: mockSetData, draw: jest.fn(), destroy: jest.fn() } as any);
      const graph: any = mount(
        <Graph
          {...({
            displayMode: GraphDisplayMode.Stacked,
            queryParams: {
              startTime: 1572128592,
              endTime: 1572128598,
              resolution: 28,
            },
            data: {
              result: [
                { values: [], metric: {} },
                { values: [], metric: {} },
              ],
            },
          } as any)}
        />
      );
      (graph.instance() as any).plot(); // create chart
      graph.find('.graph-legend').simulate('mouseout');
      expect(mockSetData).toHaveBeenCalledWith(graph.state().chartData.series);
      spyPlot.mockReset();
    });
  });
});
