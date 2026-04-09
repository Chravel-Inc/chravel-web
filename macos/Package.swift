// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "ChravelMacApp",
  platforms: [
    .macOS(.v15),
  ],
  products: [
    .executable(name: "ChravelMacApp", targets: ["ChravelMacApp"]),
  ],
  targets: [
    .executableTarget(
      name: "ChravelMacApp",
      path: "Sources/ChravelMacApp",
    ),
    .testTarget(
      name: "ChravelMacAppTests",
      dependencies: ["ChravelMacApp"],
      path: "Tests/ChravelMacAppTests",
    ),
  ],
)
