// swift-tools-version: 6.0
import PackageDescription

var products: [Product] = [
  .library(name: "ChravelMacCore", targets: ["ChravelMacCore"]),
]

var targets: [Target] = [
  .target(
    name: "ChravelMacCore",
    path: "Sources/ChravelMacCore",
  ),
  .testTarget(
    name: "ChravelMacCoreTests",
    dependencies: ["ChravelMacCore"],
    path: "Tests/ChravelMacCoreTests",
  ),
]

#if os(macOS)
products.append(.executable(name: "ChravelMacApp", targets: ["ChravelMacApp"]))
targets.append(
  .executableTarget(
    name: "ChravelMacApp",
    dependencies: ["ChravelMacCore"],
    path: "Sources/ChravelMacApp",
  )
)
#endif

let package = Package(
  name: "ChravelMacApp",
  platforms: [
    .macOS(.v15),
  ],
  products: products,
  targets: targets,
)
