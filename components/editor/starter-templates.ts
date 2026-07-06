import { MarkerType } from "@xyflow/react"

import {
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas"

export interface CanvasTemplate {
  description: string
  edges: CanvasEdge[]
  id: string
  name: string
  nodes: CanvasNode[]
}

interface TemplateNodeOptions {
  colorIndex?: number
  height?: number
  shape?: CanvasNodeShape
  width?: number
  x: number
  y: number
}

interface TemplateEdgeOptions {
  label?: string
  sourceHandle?: string
  targetHandle?: string
}

function templateNode(
  id: string,
  label: string,
  {
    colorIndex = 0,
    height = 72,
    shape = "pill",
    width = 152,
    x,
    y,
  }: TemplateNodeOptions,
): CanvasNode {
  const colorPair = NODE_COLORS[colorIndex] ?? NODE_COLORS[0]

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: {
      label,
      color: colorPair.color,
      shape,
      textColor: colorPair.textColor,
    },
    style: { height, width },
  }
}

function templateEdge(
  id: string,
  source: string,
  target: string,
  {
    label = "",
    sourceHandle = "right",
    targetHandle = "left",
  }: TemplateEdgeOptions = {},
): CanvasEdge {
  return {
    id,
    source,
    sourceHandle,
    target,
    targetHandle,
    type: "canvasEdge",
    data: { label },
    interactionWidth: 24,
    markerEnd: { type: MarkerType.ArrowClosed },
  }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "API Gateway routes traffic to isolated services, each backed by dedicated storage and connected through shared messaging.",
    nodes: [
      templateNode("ms-client", "Web & Mobile", {
        colorIndex: 1,
        shape: "hexagon",
        width: 144,
        height: 96,
        x: 0,
        y: 160,
      }),
      templateNode("ms-gateway", "API Gateway", {
        colorIndex: 2,
        x: 220,
        y: 172,
      }),
      templateNode("ms-users", "User Service", {
        colorIndex: 6,
        x: 460,
        y: 20,
      }),
      templateNode("ms-orders", "Order Service", {
        colorIndex: 3,
        x: 460,
        y: 172,
      }),
      templateNode("ms-payments", "Payment Service", {
        colorIndex: 4,
        x: 460,
        y: 324,
      }),
      templateNode("ms-users-db", "Users DB", {
        colorIndex: 6,
        shape: "cylinder",
        width: 132,
        height: 104,
        x: 720,
        y: 4,
      }),
      templateNode("ms-orders-db", "Orders DB", {
        colorIndex: 3,
        shape: "cylinder",
        width: 132,
        height: 104,
        x: 720,
        y: 156,
      }),
      templateNode("ms-events", "Event Bus", {
        colorIndex: 7,
        width: 168,
        x: 702,
        y: 332,
      }),
    ],
    edges: [
      templateEdge("ms-e-client-gateway", "ms-client", "ms-gateway"),
      templateEdge("ms-e-gateway-users", "ms-gateway", "ms-users"),
      templateEdge("ms-e-gateway-orders", "ms-gateway", "ms-orders"),
      templateEdge("ms-e-gateway-payments", "ms-gateway", "ms-payments"),
      templateEdge("ms-e-users-db", "ms-users", "ms-users-db"),
      templateEdge("ms-e-orders-db", "ms-orders", "ms-orders-db"),
      templateEdge("ms-e-orders-events", "ms-orders", "ms-events", {
        label: "publishes",
      }),
      templateEdge("ms-e-payments-events", "ms-payments", "ms-events"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "End-to-end delivery from source commit through build, test, artifact storage, and staged deployment to production.",
    nodes: [
      templateNode("ci-source", "Source Control", {
        colorIndex: 2,
        shape: "hexagon",
        width: 144,
        height: 96,
        x: 0,
        y: 100,
      }),
      templateNode("ci-build", "Build", {
        colorIndex: 1,
        x: 210,
        y: 112,
      }),
      templateNode("ci-test", "Automated Tests", {
        colorIndex: 7,
        x: 430,
        y: 112,
      }),
      templateNode("ci-gate", "Quality Gate", {
        colorIndex: 3,
        shape: "diamond",
        width: 150,
        height: 112,
        x: 650,
        y: 92,
      }),
      templateNode("ci-registry", "Artifact Registry", {
        colorIndex: 6,
        shape: "cylinder",
        width: 140,
        height: 104,
        x: 870,
        y: 96,
      }),
      templateNode("ci-deploy", "Deploy", {
        colorIndex: 2,
        x: 1080,
        y: 112,
      }),
      templateNode("ci-production", "Production", {
        colorIndex: 4,
        shape: "hexagon",
        width: 144,
        height: 96,
        x: 1300,
        y: 100,
      }),
    ],
    edges: [
      templateEdge("ci-e-source-build", "ci-source", "ci-build", {
        label: "push",
      }),
      templateEdge("ci-e-build-test", "ci-build", "ci-test"),
      templateEdge("ci-e-test-gate", "ci-test", "ci-gate"),
      templateEdge("ci-e-gate-registry", "ci-gate", "ci-registry", {
        label: "pass",
      }),
      templateEdge("ci-e-registry-deploy", "ci-registry", "ci-deploy"),
      templateEdge("ci-e-deploy-production", "ci-deploy", "ci-production"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producers publish events to a central broker. Independent consumers handle notifications, projections, and analytics.",
    nodes: [
      templateNode("event-api", "Command API", {
        colorIndex: 1,
        shape: "hexagon",
        width: 144,
        height: 96,
        x: 0,
        y: 40,
      }),
      templateNode("event-scheduler", "Scheduler", {
        colorIndex: 2,
        shape: "hexagon",
        width: 144,
        height: 96,
        x: 0,
        y: 250,
      }),
      templateNode("event-orders", "Order Producer", {
        colorIndex: 3,
        x: 230,
        y: 52,
      }),
      templateNode("event-jobs", "Job Producer", {
        colorIndex: 6,
        x: 230,
        y: 262,
      }),
      templateNode("event-broker", "Event Broker", {
        colorIndex: 7,
        width: 184,
        x: 480,
        y: 157,
      }),
      templateNode("event-projection", "Read Model", {
        colorIndex: 1,
        x: 760,
        y: 0,
      }),
      templateNode("event-notifications", "Notifications", {
        colorIndex: 5,
        x: 760,
        y: 157,
      }),
      templateNode("event-analytics", "Analytics", {
        colorIndex: 2,
        x: 760,
        y: 314,
      }),
      templateNode("event-read-db", "Query Store", {
        colorIndex: 1,
        shape: "cylinder",
        width: 132,
        height: 104,
        x: 1010,
        y: -16,
      }),
    ],
    edges: [
      templateEdge("event-e-api-orders", "event-api", "event-orders"),
      templateEdge(
        "event-e-scheduler-jobs",
        "event-scheduler",
        "event-jobs",
      ),
      templateEdge("event-e-orders-broker", "event-orders", "event-broker", {
        label: "publish",
      }),
      templateEdge("event-e-jobs-broker", "event-jobs", "event-broker", {
        label: "publish",
      }),
      templateEdge(
        "event-e-broker-projection",
        "event-broker",
        "event-projection",
      ),
      templateEdge(
        "event-e-broker-notifications",
        "event-broker",
        "event-notifications",
      ),
      templateEdge(
        "event-e-broker-analytics",
        "event-broker",
        "event-analytics",
      ),
      templateEdge(
        "event-e-projection-db",
        "event-projection",
        "event-read-db",
      ),
    ],
  },
  {
    id: "serverless-web-app",
    name: "Serverless Web App",
    description:
      "A globally delivered frontend backed by managed API functions, durable storage, and asynchronous background processing.",
    nodes: [
      templateNode("serverless-client", "Web Client", {
        colorIndex: 1,
        shape: "hexagon",
        width: 144,
        height: 96,
        x: 0,
        y: 152,
      }),
      templateNode("serverless-cdn", "CDN", {
        colorIndex: 7,
        x: 220,
        y: 40,
      }),
      templateNode("serverless-assets", "Object Storage", {
        colorIndex: 6,
        shape: "cylinder",
        width: 140,
        height: 104,
        x: 450,
        y: 24,
      }),
      templateNode("serverless-gateway", "API Gateway", {
        colorIndex: 2,
        x: 220,
        y: 264,
      }),
      templateNode("serverless-functions", "API Functions", {
        colorIndex: 3,
        x: 450,
        y: 264,
      }),
      templateNode("serverless-db", "Managed Database", {
        colorIndex: 1,
        shape: "cylinder",
        width: 144,
        height: 104,
        x: 700,
        y: 152,
      }),
      templateNode("serverless-queue", "Task Queue", {
        colorIndex: 5,
        x: 700,
        y: 320,
      }),
      templateNode("serverless-worker", "Worker Function", {
        colorIndex: 4,
        x: 940,
        y: 320,
      }),
      templateNode("serverless-notifications", "Notifications", {
        colorIndex: 2,
        shape: "hexagon",
        width: 152,
        height: 96,
        x: 1180,
        y: 308,
      }),
    ],
    edges: [
      templateEdge(
        "serverless-e-client-cdn",
        "serverless-client",
        "serverless-cdn",
      ),
      templateEdge(
        "serverless-e-cdn-assets",
        "serverless-cdn",
        "serverless-assets",
        { label: "assets" },
      ),
      templateEdge(
        "serverless-e-client-gateway",
        "serverless-client",
        "serverless-gateway",
      ),
      templateEdge(
        "serverless-e-gateway-functions",
        "serverless-gateway",
        "serverless-functions",
      ),
      templateEdge(
        "serverless-e-functions-db",
        "serverless-functions",
        "serverless-db",
      ),
      templateEdge(
        "serverless-e-functions-queue",
        "serverless-functions",
        "serverless-queue",
        { label: "enqueue" },
      ),
      templateEdge(
        "serverless-e-queue-worker",
        "serverless-queue",
        "serverless-worker",
      ),
      templateEdge(
        "serverless-e-worker-notifications",
        "serverless-worker",
        "serverless-notifications",
      ),
    ],
  },
]
