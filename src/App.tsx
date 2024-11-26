import { scaleSymlog } from "d3-scale";
//import LanguageLegend from "./legend";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  CosmographProvider,
  Cosmograph,
  CosmographTimeline,
  CosmographHistogram,
  CosmographSearch,
  CosmographRef,
  CosmographHistogramRef,
  CosmographTimelineRef,
  CosmographSearchRef,
  CosmographSearchInputConfig,
  CosmographInputConfig,
} from "@cosmograph/react";
import { nodes, links, Node, Link } from "./data";
import "./styles.css";
import chroma from "chroma-js";
export default function App() {
  // import from cosmograph
  const cosmograph = useRef<CosmographRef>();
  const histogram = useRef<CosmographHistogramRef<Node>>();
  const timeline = useRef<CosmographTimelineRef<Link>>();
  const search = useRef<CosmographSearchRef>();

  // event listner
  const [showLabelsFor, setShowLabelsFor] = useState<Node[] | undefined>(
    undefined
  );
  const [selectedNode, setSelectedNode] = useState<Node | undefined>();
  const [hoveredNode, setHoveredNode] = useState<Node | undefined>();
  const [selectedNodes, setSelectedNodes] = useState<Node[] | undefined>();
  const [selectedLinks, setSelectedLinks] = useState<Link[] | undefined>();
  const [selectedOngoingLinks, setSelectedOngoingLinks] = useState<
    Link[] | undefined
  >();
  const [selectedIncomingLinks, setSelectedIncomingLinks] = useState<
    Link[] | undefined
  >();

  // simulation
  //const [friction, setFriction] = useState(2.0);
  //const [linkDistance, setLinkDistance] = useState(20);

  // sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // highlight smaller network that directly connected to clicked node
  const onCosmographClick = useCallback<
    Exclude<CosmographInputConfig<Node, Link>["onClick"], undefined>
  >((node) => {
    search?.current?.clearInput();
    if (node) {
      //cosmograph.current?.selectNode(node);
      const connectedNodesId = new Set<string>();
      const connectedLinksId = new Set<string>();
      const OngoingLinksId = new Set<string>();
      const IncomingLinksId = new Set<string>();
      // Find links directly connected to the clicked node
      connectedNodesId.add(node.id);
      links.forEach((link) => {
        if (link.source === node.id) {
          //connectedLinks.add(link.id);
          OngoingLinksId.add(link.id);
          connectedNodesId.add(link.target);
          connectedLinksId.add(link.id);
        } else if (link.target === node.id) {
          IncomingLinksId.add(link.id);
          connectedNodesId.add(link.source);
          connectedLinksId.add(link.id);
        }
      });
      const connectedNodes = nodes.filter((n) => connectedNodesId.has(n.id));
      const connectedLinks = links.filter((l) => connectedLinksId.has(l.id));
      const connectedOngoingLinks = links.filter((l) =>
        OngoingLinksId.has(l.id)
      );
      const connectedIncomingLinks = links.filter((l) =>
        IncomingLinksId.has(l.id)
      );

      // Highlight the clicked node, connected nodes, and links
      cosmograph.current?.selectNodes(connectedNodes);
      //cosmograph.current?.selectLinks(connectedLinks);
      setSelectedNode(node);
      setSelectedNodes(connectedNodesId);
      setSelectedLinks(connectedLinksId);
      setSelectedOngoingLinks(connectedOngoingLinks);
      setSelectedIncomingLinks(connectedIncomingLinks);
      setShowLabelsFor(connectedNodesId);
    } else {
      cosmograph.current?.unselectNodes();
      // Clear highlights if no node is selected
      setSelectedNode(undefined);
      setSelectedNodes(new Set());
      setSelectedLinks(new Set());
      setSelectedOngoingLinks(undefined);
      setSelectedIncomingLinks(undefined);
      setShowLabelsFor(undefined);
    }
  }, []);

  const onCosmographHover = useCallback<
    Exclude<CosmographInputConfig<Node, Link>["onMouseMove"], undefined>
  >((node) => {
    //search?.current?.clearInput();
    if (node) {
      //cosmograph.current?.selectNode(node);
      setHoveredNode(node);
    } else {
      //cosmograph.current?.unselectNodes();
      setHoveredNode(node);
    }
  }, []);

  const onSearchSelectResult = useCallback<
    Exclude<CosmographSearchInputConfig<Node>["onSelectResult"], undefined>
  >((n) => {
    setShowLabelsFor(n ? [n] : undefined);
    setSelectedNode(n);
  }, []);

  // Color settings
  const [colorizeBy, setColorizeBy] = useState<"degree" | "language">("degree");
  const [degree, setDegree] = useState<number[]>([]);
  const [languageColors, setLanguageColors] = useState<Map<string, string>>(
    new Map()
  );
  const [groupColors, setGroupColors] = useState<Map<string, string>>(
    new Map()
  );

  const scaleColor = useRef(
    scaleSymlog<string, string>()
      .range(["rgba(80, 105, 180, 0.75)", "rgba(240, 105, 180, 0.75)"])
      .clamp(true)
  );
  const customPalette = [
    "#66c2a5",
    "#fc8d62",
    "#8da0cb",
    "#e78ac3",
    "#a6d854",
    "#ffd92f",
    "#e5c494",
    "#b3b3b3",
  ];
  const languageColor = chroma
    .scale(customPalette)
    .colors(8)
    .map((color) => chroma(color).alpha(0.75).hex());
  //console.log(scale); // Output: interpolated colors between the defined palette
  const groupColor = chroma.cubehelix()
    .start(240)
    .rotations(1)
    .gamma(0.5)
    .lightness([0.3, 0.7])
    .scale()
    .colors(9)
    .map((color) => chroma(color).alpha(0.75).hex());
  // Set degree-based coloring
  useEffect(() => {
    const degree = cosmograph?.current?.getNodeDegrees();
    if (degree) {
      scaleColor.current.domain([Math.min(...degree), Math.max(...degree)]);
      setDegree(degree);
    }
  }, [degree]);

  // Set language-based coloring
  useEffect(() => {
    const languageToColorMap = new Map<string, string>();

    // Populate the map with language-color pairs
    nodes.forEach((node) => {
      const language = node.language || "Unknown"; // Handle null values
      if (!languageToColorMap.has(language)) {
        const color =
          language === "English"
            ? languageColor[0]
            : language === "Russian"
            ? languageColor[1]
            : language === "German"
            ? languageColor[2]
            : language === "French"
            ? languageColor[3]
            : language === "Italian"
            ? languageColor[4]
            : language === "Arabic"
            ? languageColor[5]
            : language === "Spanish"
            ? languageColor[6]
            : language === "Ukrainian"
            ? languageColor[7]
            : "#919191"; // Fallback color
        languageToColorMap.set(language, color);
      }
    });

    setLanguageColors(languageToColorMap);
  }, [nodes]);

  // Set group-based coloring
  useEffect(() => {
    const groupToColorMap = new Map<string, string>();

    // Populate the map with language-color pairs
    nodes.forEach((node) => {
      const group = node.group || "Unknown"; // Handle null values
      if (!groupToColorMap.has(group)) {
        const color =
        group === "1"
            ? groupColor[0]
            : group === "2"
            ? groupColor[1]
            : group === "5"
            ? groupColor[2]
            : group === "7"
            ? groupColor[3]
            : group === "9"
            ? groupColor[4]
            : group === "10"
            ? groupColor[5]
            : group === "14"
            ? groupColor[6]
            : group === "15"
            ? groupColor[7]
            : group === "18"
            ? groupColor[8]
            : "#919191"; // Fallback color
        groupToColorMap.set(group, color);
      }
    });

    setGroupColors(groupToColorMap);
  }, [nodes]);

  // Node color logic
  const nodeColor = useCallback(
    (n: Node, index: number) => {
      if (colorizeBy === "degree") {
        const degreeValue = degree[index];
        return degreeValue !== undefined
          ? scaleColor.current?.(degreeValue)
          : null;
      } else if (colorizeBy === "language") {
        return languageColors.get(n.language || "Unknown") || "#CCCCCC"; // Fallback color
      } else if (colorizeBy === "group") {
        return groupColors.get(n.group || "Unknown") || "#CCCCCC"; // Fallback color
      }
      return null;
    },
    [degree, colorizeBy, languageColors, groupColors]
  );

  // Handle dropdown change
  const handleColorizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setColorizeBy(e.target.value as "degree" | "language");
  };
  return (
    <div className="wrapper">
      <CosmographProvider nodes={nodes} links={links}>
        <button onClick={toggleSidebar} className="toggleButton">
          {isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        </button>

        <div className={`sidebarStyle ${isSidebarOpen ? "open" : "closed"}`}>
          <select
            id="colorizeDropdown"
            value={colorizeBy}
            onChange={handleColorizeChange}
          >
            <option value="degree"> Colorizing by Degree</option>
            <option value="language">Colorizing by Language</option>
            <option value="group">Colorizing by Topic</option>
          </select>

          <div className="histogramWrapper">
            <div className="histogramTitle">Channel Participants</div>
            <CosmographHistogram
              className="histogramStyle"
              ref={histogram}
              barCount={100}
            />
            <div className="histogramTitle">Message Forwards</div>
            <CosmographHistogram
              className="histogramStyle"
              accessor={(l: Link) => l.forwards ?? null}
              ref={histogram}
              barCount={100}
              filterType={links}
            />
            <div className="histogramTitle">Message Views</div>
            <CosmographHistogram
              className="histogramStyle"
              accessor={(l: Link) => l.views ?? null}
              ref={histogram}
              barCount={100}
              filterType={links}
            />
          </div>
          <CosmographSearch
            ref={search}
            className="searchStyle"
            onSelectResult={onSearchSelectResult}
            maxVisibleItems={20}
            accessors={[
              { label: "channel_id", accessor: (n) => n.id },
              { label: "channel_name", accessor: (n) => n.label ?? null },
              {
                label: "channel_description",
                accessor: (n) => n.description ?? null,
              },
              {
                label: "channel_language",
                accessor: (n) => n.language ?? null,
              },
            ]}
          />
        </div>
        <div className="infoBox">
          <h3 className="infoBoxTitle">Hovered Node</h3>
          <ul className="infoBoxList">
            {hoveredNode ? (
              <li className="infoBoxListItem">
                  <strong>ID:</strong> {hoveredNode.id}<br/>
                  <strong>Name:</strong> {hoveredNode.label}<br/>
                  <strong>Participants:</strong> {hoveredNode.value}<br/>
                  <strong>Group:</strong> {hoveredNode.group}<br/>
                  <strong>Language:</strong> {hoveredNode.language}<br/>
                  <strong>Description:</strong> {hoveredNode.description}<br/>
              </li>
            ) : (
              <p className="emptyState">No node hovered.</p>
            )}
          </ul>
          <h3 className="infoBoxTitle">Selected Node</h3>
          <ul className="infoBoxList">
            {selectedNode ? (
              <li className="infoBoxListItem">
                  <strong>ID:</strong> {selectedNode.id}<br/>
                  <strong>Name:</strong> {selectedNode.label}<br/>
                  <strong>Participants:</strong> {selectedNode.value}<br/>
                  <strong>Group:</strong> {selectedNode.group}<br/>
                  <strong>Language:</strong> {selectedNode.language}<br/>
                  <strong>Description:</strong> {selectedNode.description}<br/>
              </li>
            ) : (
              <p className="emptyState">No node selected.</p>
            )}
          </ul>
          <h3 className="infoBoxTitle">
            Incoming Links 
            {selectedIncomingLinks && selectedIncomingLinks.length > 0
              ? ` (${selectedIncomingLinks.length})`
              : ''}
          </h3>
          {selectedIncomingLinks && selectedIncomingLinks.length > 0 ? (
            <ul className="infoBoxList">
              {selectedIncomingLinks.map((link) => (
                <li key={link.id} className="infoBoxListItem">
                    <strong>Source:</strong> {link.source}<br/>
                    <strong>Message:</strong> {link.message}<br/>
                    <strong>Language:</strong> {link.language}<br/>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">
              No incoming links available for this node.
            </p>
          )}
          <h3 className="infoBoxTitle">
            Outgoing Links 
            {selectedOngoingLinks && selectedOngoingLinks.length > 0
              ? ` (${selectedOngoingLinks.length})`
              : ''}
          </h3>
          {selectedOngoingLinks && selectedOngoingLinks.length > 0 ? (
            <ul className="infoBoxList">
              {selectedOngoingLinks.map((link) => (
                <li key={link.id} className="infoBoxListItem">
                    <strong>Target:</strong> {link.target}<br/>
                    <strong>Time:</strong> {link.time}<br/>
                    <strong>Message:</strong> {link.message}<br/>
                    <strong>Language:</strong> {link.language}<br/>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">
              No outgoing links available for this node.
            </p>
          )}
        </div>
        <Cosmograph
          ref={cosmograph}
          className="cosmographStyle"
          nodeLabelAccessor={(n) => n.label ?? null}
          showTopLabels
          showLabelsFor={showLabelsFor}
          nodeLabelColor={"white"}
          hoveredNodeLabelColor={"white"}
          nodeSize={(n) => n.size ?? null}
          linkArrowsSizeScale={1.5}
          linkWidth={(l: Link) => l.width ?? null}
          linkGreyoutOpacity={0}
          nodeColor={nodeColor}
          //linkColor={(l: Link) => l.color ?? null}
          onClick={onCosmographClick}
          onMouseMove={onCosmographHover}
          //curvedLinks={true}
          //simulations
          simulationFriction={2.0}
          simulationLinkSpring={0.5}
          simulationLinkDistance={20}
          simulationRepulsionFromMouse={4.0}
          simulationCenter={0.5}
        />
        <CosmographTimeline
          className="timelineStyle"
          ref={timeline}
          showAnimationControls
          //dataStep={d3.timeMonth.every(1).count()}
          //tickStep={d3.timeMonth.every(1)}
          animationSpeed={5}
        />
      </CosmographProvider>
    </div>
  );
}
