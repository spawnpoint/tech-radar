"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface RadarEntry {
  quadrant: number
  ring: number
  label: string
  active: boolean
  moved: number
  tags: string[]
  link?: string
  id?: string
  x?: number
  y?: number
  color?: string
  segment?: any
  filtered?: boolean
}

interface RadarConfig {
  date: string
  tags: string[]
  entries: RadarEntry[]
}

interface Props {
  config: RadarConfig
}

const QUADRANTS = [
  { name: "Languages" },
  { name: "Infrastructure" },
  { name: "Datastores" },
  { name: "Data Management" },
]

const RINGS = [
  { name: "ADOPT", color: "#5ba300" },
  { name: "TRIAL", color: "#009eb0" },
  { name: "ASSESS", color: "#c7ba00" },
  { name: "HOLD", color: "#e09b96" },
]

export default function TechRadar({ config }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [entries, setEntries] = useState<RadarEntry[]>(config.entries)
  const radarConfigRef = useRef<any>(null)

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    if (config.tags && Array.isArray(config.tags)) {
      config.tags.forEach((tag) => tagSet.add(tag))
    }
    config.entries.forEach((entry) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [config])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tag)) {
        newSet.delete(tag)
      } else {
        newSet.add(tag)
      }
      return newSet
    })
  }

  const clearFilters = () => {
    setSelectedTags(new Set())
  }

  // Calculate filtered entries
  const filteredEntries = useMemo(() => {
    if (selectedTags.size === 0) {
      return entries.map((e) => ({ ...e, filtered: false }))
    }
    return entries.map((entry) => {
      const entryTags = entry.tags || []
      const matches = Array.from(selectedTags).every((tag) => entryTags.includes(tag))
      return { ...entry, filtered: !matches }
    })
  }, [entries, selectedTags])

  const matchCount = filteredEntries.filter((e) => !e.filtered).length

  // Apply filter visual updates
  useEffect(() => {
    if (!svgRef.current) return

    d3.selectAll(".blip").each(function (d: any) {
      const entry = filteredEntries.find((e) => e.id === d?.id)
      d3.select(this).style("opacity", entry?.filtered ? 0.15 : 1)
    })

    filteredEntries.forEach((entry) => {
      const legendItem = document.getElementById("legendItem" + entry.id)
      if (legendItem) {
        legendItem.style.opacity = entry.filtered ? "0.15" : "1"
      }
    })
  }, [filteredEntries])

  // Initialize radar visualization
  useEffect(() => {
    if (!svgRef.current) return

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    const radarEntries = [...config.entries]
    
    const radarConfig = {
      svg_id: "radar",
      repo_url: "https://github.com/zalando/tech-radar",
      title: "Zalando Tech Radar",
      date: config.date,
      quadrants: QUADRANTS,
      rings: RINGS,
      entries: radarEntries,
      width: 1450,
      height: 1000,
      colors: {
        background: "#fff",
        grid: "#dddde0",
        inactive: "#ddd",
      },
      print_layout: true,
      links_in_new_tabs: true,
    }

    radarConfigRef.current = radarConfig
    radar_visualization(radarConfig)
    setEntries(radarConfig.entries)
  }, [config])

  return (
    <div className="min-h-screen bg-background">
      {/* Tag Filter Section */}
      <div className="mx-[50px] my-5 rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Filter by tags:</span>
          {selectedTags.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-3 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          )}
          {selectedTags.size > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">
              {matchCount} of {entries.length} entries
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.has(tag) ? "default" : "outline"}
              className="cursor-pointer transition-colors hover:bg-primary/80 hover:text-primary-foreground"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Radar SVG */}
      <svg id="radar" ref={svgRef} className="block" />

      {/* Info Section */}
      <div className="mx-[50px] grid grid-cols-2 gap-[60px] pb-12">
        <div>
          <h3 className="mb-4 mt-8 text-xl font-bold">What is the Tech Radar?</h3>
          <p className="mb-4 text-muted-foreground">
            The Zalando Tech Radar is a list of technologies, complemented by an assessment result,
            called <em>ring assignment</em>. We use four rings with the following semantics:
          </p>
          <ul className="space-y-4 text-muted-foreground">
            <li>
              <strong className="text-foreground">ADOPT</strong> — Technologies we have high
              confidence in to serve our purpose, also in large scale. Technologies with a usage
              culture in our Zalando production environment, low risk and recommended to be widely
              used.
            </li>
            <li>
              <strong className="text-foreground">TRIAL</strong> — Technologies that we have seen
              work with success in project work to solve a real problem; first serious usage
              experience that confirm benefits and can uncover limitations.
            </li>
            <li>
              <strong className="text-foreground">ASSESS</strong> — Technologies that are promising
              and have clear potential value-add for us; technologies worth to invest some research
              and prototyping efforts in to see if it has impact.
            </li>
            <li>
              <strong className="text-foreground">HOLD</strong> — Technologies not recommended to be
              used for new projects. Technologies that we think are not (yet) worth to (further)
              invest in.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 mt-8 text-xl font-bold">What is the purpose?</h3>
          <p className="mb-4 text-muted-foreground">
            The Tech Radar is a tool to inspire and support Engineering teams at Zalando to pick the
            best technologies for new projects; it provides a platform to share knowledge and
            experience in technologies, to reflect on technology decisions and continuously evolve
            our technology landscape.
          </p>
          <h3 className="mb-4 mt-8 text-xl font-bold">How do we maintain it?</h3>
          <p className="mb-4 text-muted-foreground">
            The Tech Radar is maintained by our <em>Principal Engineers</em> — who facilitate and
            drive the technology selection discussions at Zalando across the Engineering Community.
            Assignment of technologies to rings is the outcome of ring change proposals, which are
            discussed and voted on.
          </p>
          <p className="text-sm text-muted-foreground">
            <em>
              BTW, if you would like to create your own Tech Radar — we have{" "}
              <a
                href="https://github.com/zalando/tech-radar"
                className="text-primary underline hover:no-underline"
              >
                open sourced the code
              </a>{" "}
              to generate this visualization.
            </em>
          </p>
        </div>
      </div>
    </div>
  )
}

// D3 Radar Visualization Function
function radar_visualization(config: any) {
  const width = config.width || 1450
  const height = config.height || 1000
  const colors = config.colors || {
    background: "#fff",
    grid: "#dddde0",
    inactive: "#ddd",
  }
  const print_layout = config.print_layout !== undefined ? config.print_layout : true
  const links_in_new_tabs = config.links_in_new_tabs !== undefined ? config.links_in_new_tabs : true
  const font_family = config.font_family || "Arial, Helvetica"
  const legend_offset = config.legend_offset || [
    { x: 450, y: 90 },
    { x: -675, y: 90 },
    { x: -675, y: -310 },
    { x: 450, y: -310 },
  ]
  const title_offset = config.title_offset || { x: -675, y: -420 }
  const footer_offset = config.footer_offset || { x: -155, y: 450 }
  const legend_column_width = config.legend_column_width || 140
  const legend_line_height = config.legend_line_height || 10

  // Custom random number generator for reproducibility
  let seed = 42
  function random() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  function random_between(min: number, max: number) {
    return min + random() * (max - min)
  }

  function normal_between(min: number, max: number) {
    return min + (random() + random()) * 0.5 * (max - min)
  }

  const quadrants = [
    { radial_min: 0, radial_max: 0.5, factor_x: 1, factor_y: 1 },
    { radial_min: 0.5, radial_max: 1, factor_x: -1, factor_y: 1 },
    { radial_min: -1, radial_max: -0.5, factor_x: -1, factor_y: -1 },
    { radial_min: -0.5, radial_max: 0, factor_x: 1, factor_y: -1 },
  ]

  const rings = [{ radius: 130 }, { radius: 220 }, { radius: 310 }, { radius: 400 }]

  function polar(cartesian: { x: number; y: number }) {
    return {
      t: Math.atan2(cartesian.y, cartesian.x),
      r: Math.sqrt(cartesian.x * cartesian.x + cartesian.y * cartesian.y),
    }
  }

  function cartesian(p: { t: number; r: number }) {
    return {
      x: p.r * Math.cos(p.t),
      y: p.r * Math.sin(p.t),
    }
  }

  function bounded_interval(value: number, min: number, max: number) {
    const low = Math.min(min, max)
    const high = Math.max(min, max)
    return Math.min(Math.max(value, low), high)
  }

  function bounded_ring(p: { t: number; r: number }, r_min: number, r_max: number) {
    return {
      t: p.t,
      r: bounded_interval(p.r, r_min, r_max),
    }
  }

  function bounded_box(
    point: { x: number; y: number },
    min: { x: number; y: number },
    max: { x: number; y: number }
  ) {
    return {
      x: bounded_interval(point.x, min.x, max.x),
      y: bounded_interval(point.y, min.y, max.y),
    }
  }

  function segment(quadrant: number, ring: number) {
    const polar_min = {
      t: quadrants[quadrant].radial_min * Math.PI,
      r: ring === 0 ? 30 : rings[ring - 1].radius,
    }
    const polar_max = {
      t: quadrants[quadrant].radial_max * Math.PI,
      r: rings[ring].radius,
    }
    const cartesian_min = {
      x: 15 * quadrants[quadrant].factor_x,
      y: 15 * quadrants[quadrant].factor_y,
    }
    const cartesian_max = {
      x: rings[3].radius * quadrants[quadrant].factor_x,
      y: rings[3].radius * quadrants[quadrant].factor_y,
    }
    return {
      clipx: function (d: any) {
        const c = bounded_box(d, cartesian_min, cartesian_max)
        const p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15)
        d.x = cartesian(p).x
        return d.x
      },
      clipy: function (d: any) {
        const c = bounded_box(d, cartesian_min, cartesian_max)
        const p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15)
        d.y = cartesian(p).y
        return d.y
      },
      random: function () {
        return cartesian({
          t: random_between(polar_min.t, polar_max.t),
          r: normal_between(polar_min.r, polar_max.r),
        })
      },
    }
  }

  // Position each entry randomly in its segment
  for (let i = 0; i < config.entries.length; i++) {
    const entry = config.entries[i]
    entry.segment = segment(entry.quadrant, entry.ring)
    const point = entry.segment.random()
    entry.x = point.x
    entry.y = point.y
    entry.color =
      entry.active || print_layout ? config.rings[entry.ring].color : colors.inactive
  }

  // Partition entries according to segments
  const segmented: any[][] = new Array(4)
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    segmented[quadrant] = new Array(4)
    for (let ring = 0; ring < 4; ring++) {
      segmented[quadrant][ring] = []
    }
  }
  for (let i = 0; i < config.entries.length; i++) {
    const entry = config.entries[i]
    segmented[entry.quadrant][entry.ring].push(entry)
  }

  // Assign unique sequential id to each entry
  let id = 1
  for (const quadrant of [2, 3, 1, 0]) {
    for (let ring = 0; ring < 4; ring++) {
      const entriesInSegment = segmented[quadrant][ring]
      entriesInSegment.sort((a: any, b: any) => a.label.localeCompare(b.label))
      for (let i = 0; i < entriesInSegment.length; i++) {
        entriesInSegment[i].id = "" + id++
      }
    }
  }

  function translate(x: number, y: number) {
    return "translate(" + x + "," + y + ")"
  }

  const scale = config.scale || 1
  const scaled_width = width * scale
  const scaled_height = height * scale

  const svg = d3
    .select("svg#" + config.svg_id)
    .style("background-color", colors.background)
    .attr("width", scaled_width)
    .attr("height", scaled_height)

  const radar = svg.append("g")
  radar.attr("transform", translate(scaled_width / 2, scaled_height / 2).concat(`scale(${scale})`))

  const grid = radar.append("g")

  // Draw grid lines
  grid
    .append("line")
    .attr("x1", 0)
    .attr("y1", -400)
    .attr("x2", 0)
    .attr("y2", 400)
    .style("stroke", colors.grid)
    .style("stroke-width", 1)
  grid
    .append("line")
    .attr("x1", -400)
    .attr("y1", 0)
    .attr("x2", 400)
    .attr("y2", 0)
    .style("stroke", colors.grid)
    .style("stroke-width", 1)

  // Background color filter
  const defs = grid.append("defs")
  const filter = defs.append("filter").attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1).attr("id", "solid")
  filter.append("feFlood").attr("flood-color", "rgb(0, 0, 0, 0.8)")
  filter.append("feComposite").attr("in", "SourceGraphic")

  // Draw rings
  for (let i = 0; i < rings.length; i++) {
    grid
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", rings[i].radius)
      .style("fill", "none")
      .style("stroke", colors.grid)
      .style("stroke-width", 1)
    if (print_layout) {
      grid
        .append("text")
        .text(config.rings[i].name)
        .attr("y", -rings[i].radius + 62)
        .attr("text-anchor", "middle")
        .style("fill", config.rings[i].color)
        .style("opacity", 0.35)
        .style("font-family", font_family)
        .style("font-size", "42px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none")
    }
  }

  function legend_transform(
    quadrant: number,
    ring: number,
    legendColumnWidth: number,
    index: number | null = null,
    previousHeight: number = 0
  ) {
    const dx = ring < 2 ? 0 : legendColumnWidth
    let dy = index == null ? -16 : index * legend_line_height
    if (ring % 2 === 1) {
      dy = dy + 36 + previousHeight
    }
    return translate(legend_offset[quadrant].x + dx, legend_offset[quadrant].y + dy)
  }

  // Draw title and legend (only in print layout)
  if (print_layout) {
    // Title
    radar
      .append("a")
      .attr("href", config.repo_url)
      .attr("transform", translate(title_offset.x, title_offset.y))
      .append("text")
      .attr("class", "hover-underline")
      .text(config.title)
      .style("font-family", font_family)
      .style("font-size", "30")
      .style("font-weight", "bold")
      .style("fill", "currentColor")

    // Date
    radar
      .append("text")
      .attr("transform", translate(title_offset.x, title_offset.y + 20))
      .text(config.date || "")
      .style("font-family", font_family)
      .style("font-size", "14")
      .style("fill", "#999")

    // Footer
    radar
      .append("text")
      .attr("transform", translate(footer_offset.x, footer_offset.y))
      .text("▲ moved up     ▼ moved down     ★ new     ⬤ no change")
      .attr("xml:space", "preserve")
      .style("font-family", font_family)
      .style("font-size", "12px")
      .style("fill", "currentColor")

    // Legend
    const legend = radar.append("g")
    for (let quadrant = 0; quadrant < 4; quadrant++) {
      legend
        .append("text")
        .attr("transform", translate(legend_offset[quadrant].x, legend_offset[quadrant].y - 45))
        .text(config.quadrants[quadrant].name)
        .style("font-family", font_family)
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "currentColor")

      let previousLegendHeight = 0
      for (let ring = 0; ring < 4; ring++) {
        if (ring % 2 === 0) {
          previousLegendHeight = 0
        }
        legend
          .append("text")
          .attr("transform", legend_transform(quadrant, ring, legend_column_width, null, previousLegendHeight))
          .text(config.rings[ring].name)
          .style("font-family", font_family)
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", config.rings[ring].color)

        legend
          .selectAll(".legend" + quadrant + ring)
          .data(segmented[quadrant][ring])
          .enter()
          .append("a")
          .attr("href", function (d: any) {
            return d.link ? d.link : "#"
          })
          .attr("target", function (d: any) {
            return d.link && links_in_new_tabs ? "_blank" : null
          })
          .append("text")
          .attr("transform", function (d: any, i: number) {
            return legend_transform(quadrant, ring, legend_column_width, i, previousLegendHeight)
          })
          .attr("class", "legend" + quadrant + ring)
          .attr("id", function (d: any) {
            return "legendItem" + d.id
          })
          .text(function (d: any) {
            return d.id + ". " + d.label
          })
          .style("font-family", font_family)
          .style("font-size", "11px")
          .style("fill", "currentColor")
          .on("mouseover", function (event: any, d: any) {
            showBubble(d)
            highlightLegendItem(d)
          })
          .on("mouseout", function (event: any, d: any) {
            hideBubble(d)
            unhighlightLegendItem(d)
          })
          .call(wrap_text)
          .each(function () {
            previousLegendHeight += (d3.select(this).node() as SVGGraphicsElement)?.getBBox()?.height || 0
          })
      }
    }
  }

  function wrap_text(text: any) {
    let heightForNextElement = 0
    text.each(function (this: any) {
      const textElement = d3.select(this)
      const words = textElement.text().split(" ")

      const number = `${textElement.text().split(".")[0]}. |`
      const legendNumberText = textElement.append("tspan").text(number)
      const legendBar = textElement.append("tspan").text("|")
      const numberWidth =
        (legendNumberText.node() as SVGTSpanElement)?.getComputedTextLength() -
        (legendBar.node() as SVGTSpanElement)?.getComputedTextLength()

      textElement.text(null)

      let line: string[] = []
      let tspan = textElement
        .append("tspan")
        .attr("x", 0)
        .attr("y", heightForNextElement)
        .attr("dy", 0)

      for (let position = 0; position < words.length; position++) {
        line.push(words[position])
        tspan.text(line.join(" "))

        if ((tspan.node() as SVGTSpanElement)?.getComputedTextLength() > legend_column_width && position !== 1) {
          line.pop()
          tspan.text(line.join(" "))
          line = [words[position]]
          tspan = textElement
            .append("tspan")
            .attr("x", numberWidth)
            .attr("dy", legend_line_height)
            .text(words[position])
        }
      }

      const textBoundingBox = (textElement.node() as SVGGraphicsElement)?.getBBox()
      heightForNextElement = textBoundingBox ? textBoundingBox.y + textBoundingBox.height : 0
    })
  }

  // Layer for entries
  const rink = radar.append("g").attr("id", "rink")

  // Rollover bubble
  const bubble = radar
    .append("g")
    .attr("id", "bubble")
    .attr("x", 0)
    .attr("y", 0)
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("user-select", "none")
  bubble.append("rect").attr("rx", 4).attr("ry", 4).style("fill", "#333")
  bubble.append("text").style("font-family", font_family).style("font-size", "10px").style("fill", "#fff")
  bubble.append("path").attr("d", "M 0,0 10,0 5,8 z").style("fill", "#333")

  function showBubble(d: any) {
    if (d.active || print_layout) {
      const tooltip = d3.select("#bubble text").text(d.label)
      const bbox = (tooltip.node() as SVGGraphicsElement)?.getBBox()
      if (bbox) {
        d3.select("#bubble")
          .attr("transform", translate(d.x - bbox.width / 2, d.y - 16))
          .style("opacity", 0.8)
        d3.select("#bubble rect")
          .attr("x", -5)
          .attr("y", -bbox.height)
          .attr("width", bbox.width + 10)
          .attr("height", bbox.height + 4)
        d3.select("#bubble path").attr("transform", translate(bbox.width / 2 - 5, 3))
      }
    }
  }

  function hideBubble(_d: any) {
    d3.select("#bubble").attr("transform", translate(0, 0)).style("opacity", 0)
  }

  function highlightLegendItem(d: any) {
    const legendItem = document.getElementById("legendItem" + d.id)
    if (legendItem) {
      legendItem.setAttribute("filter", "url(#solid)")
      legendItem.setAttribute("fill", "white")
    }
  }

  function unhighlightLegendItem(d: any) {
    const legendItem = document.getElementById("legendItem" + d.id)
    if (legendItem) {
      legendItem.removeAttribute("filter")
      legendItem.removeAttribute("fill")
    }
  }

  // Draw blips on radar
  const blips = rink
    .selectAll(".blip")
    .data(config.entries)
    .enter()
    .append("g")
    .attr("class", "blip")
    .attr("transform", function (d: any, i: number) {
      return legend_transform(d.quadrant, d.ring, legend_column_width, i)
    })
    .on("mouseover", function (event: any, d: any) {
      showBubble(d)
      highlightLegendItem(d)
    })
    .on("mouseout", function (event: any, d: any) {
      hideBubble(d)
      unhighlightLegendItem(d)
    })

  // Configure each blip
  blips.each(function (this: any, d: any) {
    let blip: any = d3.select(this)

    if (d.active && Object.prototype.hasOwnProperty.call(d, "link") && d.link) {
      blip = blip.append("a").attr("xlink:href", d.link)
      if (links_in_new_tabs) {
        blip.attr("target", "_blank")
      }
    }

    // Blip shape
    if (d.moved === 1) {
      blip.append("path").attr("d", "M -11,5 11,5 0,-13 z").style("fill", d.color)
    } else if (d.moved === -1) {
      blip.append("path").attr("d", "M -11,-5 11,-5 0,13 z").style("fill", d.color)
    } else if (d.moved === 2) {
      blip
        .append("path")
        .attr("d", d3.symbol().type(d3.symbolStar).size(200)())
        .style("fill", d.color)
    } else {
      blip.append("circle").attr("r", 9).attr("fill", d.color)
    }

    // Blip text
    if (d.active || print_layout) {
      const blip_text = print_layout ? d.id : d.label.match(/[a-z]/i)?.[0] || ""
      blip
        .append("text")
        .text(blip_text)
        .attr("y", 3)
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-family", font_family)
        .style("font-size", blip_text.length > 2 ? "8px" : "9px")
        .style("pointer-events", "none")
        .style("user-select", "none")
    }
  })

  // Make sure blips stay inside their segment
  function ticked() {
    blips.attr("transform", function (d: any) {
      return translate(d.segment.clipx(d), d.segment.clipy(d))
    })
  }

  // Distribute blips while avoiding collisions
  d3.forceSimulation()
    .nodes(config.entries)
    .velocityDecay(0.19)
    .force("collision", d3.forceCollide().radius(12).strength(0.85))
    .on("tick", ticked)
}
