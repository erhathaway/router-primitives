import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import Router, { registerRouter, initalizeRouter } from 'recursive-router';
import styled from 'styled-components';
import { SteppedLineTo } from 'react-lineto';

import {
  RouterScene,
  RouterCard,
  RouterFeature,
  RouterData,
} from './Visualizer';

const Line = styled.div`
  position: absolute;
  border: 0.5px solid gray;
`;

class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mounted: false,
    }
    // this.drawGraph = this.drawGraph.bind(this)
  }

  componentDidMount() {
    this.drawGraph();
    this.setState({ mounted: true })
    window.addEventListener("resize", this.forceUpdate);
  }

  componentDidUpdate() {
    this.drawGraph();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.forceUpdate);
  }

  drawEdges(parentId, childIds) {
    const childEls = childIds.map(id => {
      const el = document.getElementById(id);
      const coords = el ? el.getBoundingClientRect() : {};
      return { el, id, coords }
    });
    const parentEl = document.getElementById(parentId);

    // child element that is closest to the left of the page
    const leftMostChild = childEls
      .sort((a, b) => {
        if (a.coords.left < b.coords.left) { return -1 }
        if (a.coords.left > b.coords.left) { return 1 }
        return 0;
      })[0];

    // child element that is closest to the right of the page
    const rightMostChild = childEls
      .sort((a, b) => {
        if (a.coords.right > b.coords.right) { return -1 }
        if (a.coords.right < b.coords.right) { return 1 }
        return 0;
      })[0];

    const parentBottom = parentEl.getBoundingClientRect().bottom;

    // child elements that is closest to the top of the page
    const childTop = childEls
      .sort((a, b) => {
        if (a.coords.top < b.coords.top) { return -1 }
        if (a.coords.top > b.coords.top) { return 1 }
        return 0;
      })[0];
    const parentAndChildVerticalDiff = childTop.coords.top - parentBottom;

    const mainHorizontalLeft = leftMostChild.coords.left + ((leftMostChild.coords.right - leftMostChild.coords.left) / 2);
    const mainHorizontalRight = rightMostChild.coords.left + ((rightMostChild.coords.right - rightMostChild.coords.left) / 2);
    const mainHorizontalY = (parentBottom + (parentAndChildVerticalDiff / 2));

    const containerEl = document.getElementsByClassName('playground-routes')[0].getBoundingClientRect();
    const HORIZONTAL_ADJUSTMENT = containerEl.left;
    const VERTICAL_ADJUSTMENT = containerEl.top + 21;
    const horizontals = [];
    const verticals = [];


    /**
    * Horizontal connector connecting parent node to all child nodes
    */
    const horizontalConnector = {
      top: mainHorizontalY - VERTICAL_ADJUSTMENT,
      left: mainHorizontalLeft - HORIZONTAL_ADJUSTMENT,
      width: mainHorizontalRight - mainHorizontalLeft,
      height: '1px',
    };
    horizontals.push(horizontalConnector)


    /**
    * Child nodes to horizontal connector
    */
    childEls.forEach(({ coords }) => {
      const x = coords.left + ((coords.right - coords.left) / 2);
      const bottom = coords.top;
      const top = (parentBottom + (parentAndChildVerticalDiff / 2));
      verticals.push({ left: x - HORIZONTAL_ADJUSTMENT, width: '1px', top: top - VERTICAL_ADJUSTMENT, height: bottom - top });
    });

    /**
     * Parent node to horizontal connector
     */
    const x = leftMostChild.coords.left + ((leftMostChild.coords.right - leftMostChild.coords.left) / 2);
    const bottom = (parentBottom + (parentAndChildVerticalDiff / 2));
    const top = parentBottom;
    verticals.push({ left: x - HORIZONTAL_ADJUSTMENT, width: '1px', top: top - VERTICAL_ADJUSTMENT, height: bottom - top });

    return { horizontals, verticals }
  }

  drawGraph() {
    const { edges } = this.props;
    const nodes = {};
    edges.forEach(({ to, from }) => {
      if (nodes[from]) { nodes[from].push(to); }
      else { nodes[from] = [to]; }
    });

    const parentNodes = Object.keys(nodes);
    const edgesByParentNode = parentNodes.map(pN => this.drawEdges(pN, nodes[pN]));
    return edgesByParentNode
  };

  render() {
    if (this.state.mounted) {
      const edgesByParentNode = this.drawGraph();
      const lines = [];

      edgesByParentNode.forEach(({ horizontals, verticals }) => {
        lines.push(...horizontals.map(attrs => <Line style={attrs} />))
        lines.push(...verticals.map(attrs => <Line style={attrs} />))
      })
      return lines;
    }
    return null
  }
}

export default Graph
