System.register("chunks:///_virtual/CentralizedHotUpdateManager.ts", ['cc'], function (exports) {
  var cclegacy, _decorator, Component, EventTarget, sys, director, Director, resources, JsonAsset, game, assetManager, Prefab, instantiate;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Component = module.Component;
      EventTarget = module.EventTarget;
      sys = module.sys;
      director = module.director;
      Director = module.Director;
      resources = module.resources;
      JsonAsset = module.JsonAsset;
      game = module.game;
      assetManager = module.assetManager;
      Prefab = module.Prefab;
      instantiate = module.instantiate;
    }],
    execute: function () {
      var _dec, _class, _class2;
      cclegacy._RF.push({}, "31a16H0SGBAJKYDj8pmhjWc", "CentralizedHotUpdateManager", undefined);
      const {
        ccclass
      } = _decorator;
      let CentralizedHotUpdateManager = exports('CentralizedHotUpdateManager', (_dec = ccclass('CentralizedHotUpdateManager'), _dec(_class = (_class2 = class CentralizedHotUpdateManager extends Component {
        constructor(...args) {
          super(...args);
          this.bundleConfigs = {};
          this.isJSBInitialized = false;
          this.storagePath = '';
          this.bundleVersions = {};
          this.eventTarget = new EventTarget();
          this.pendingUpdates = 0;
          this.restartNeeded = false;
        }
        onLoad() {
          // Initialize storage path
          if (sys.isNative) {
            this.storagePath = (jsb.fileUtils && jsb.fileUtils.getWritablePath ? jsb.fileUtils.getWritablePath() : '/') + 'hot-update/';
            this.initializeJSB();
            this.loadBundleVersions();
          }

          // Wait for the scene to be ready before loading bundle configs
          director.on(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            this.loadBundleConfigs();
          }, this);
        }
        initializeJSB() {
          if (sys.isNative) {
            // Initialize JSB environment
            this.isJSBInitialized = true;

            // Ensure storage directory exists
            if (!jsb.fileUtils.isDirectoryExist(this.storagePath)) {
              jsb.fileUtils.createDirectory(this.storagePath);
            }
          }
        }
        loadBundleVersions() {
          try {
            const versionsJson = sys.localStorage.getItem('bundleVersions');
            if (versionsJson) {
              this.bundleVersions = JSON.parse(versionsJson);
              console.log('[HotUpdate][loadBundleVersions] Loaded bundle versions:', this.bundleVersions);
            } else {
              console.log('[HotUpdate][loadBundleVersions] No bundle versions found in localStorage.');
            }
          } catch (error) {
            console.error('[HotUpdate][loadBundleVersions] Failed to load bundle versions:', error);
            this.bundleVersions = {};
          }
        }
        saveBundleVersions() {
          try {
            sys.localStorage.setItem('bundleVersions', JSON.stringify(this.bundleVersions));
            console.log('[HotUpdate][saveBundleVersions] Saved bundle versions:', this.bundleVersions);
          } catch (error) {
            console.error('[HotUpdate][saveBundleVersions] Failed to save bundle versions:', error);
          }
        }
        updateBundleVersion(bundleName, version) {
          this.bundleVersions[bundleName] = {
            version: version,
            lastUpdate: Date.now()
          };
          console.log(`[HotUpdate][updateBundleVersion] Updated version for bundle '${bundleName}':`, this.bundleVersions[bundleName]);
          this.saveBundleVersions();
        }
        getBundleVersion(bundleName) {
          var _this$bundleVersions$;
          const version = ((_this$bundleVersions$ = this.bundleVersions[bundleName]) == null ? void 0 : _this$bundleVersions$.version) || null;
          console.log(`[HotUpdate][getBundleVersion] Bundle '${bundleName}' version:`, version);
          return version;
        }
        clearBundleCache(bundleName) {
          if (sys.isNative) {
            const bundlePath = this.storagePath + bundleName;
            if (jsb.fileUtils.isDirectoryExist(bundlePath)) {
              jsb.fileUtils.removeDirectory(bundlePath);
              console.log(`[HotUpdate][clearBundleCache] Cleared cache for bundle '${bundleName}' at path:`, bundlePath);
            } else {
              console.log(`[HotUpdate][clearBundleCache] No cache found for bundle '${bundleName}' at path:`, bundlePath);
            }
          }
        }
        findNodeByName(root, name) {
          if (root.name === name) return root;
          for (const child of root.children) {
            const found = this.findNodeByName(child, name);
            if (found) return found;
          }
          return null;
        }
        loadBundleConfigs() {
          resources.load('bundleConfig', JsonAsset, (err, jsonAsset) => {
            if (err) {
              console.error('[HotUpdate] Failed to load bundle config:', err);
              return;
            }
            const configs = jsonAsset.json;
            // Convert array to object for easier lookup
            this.bundleConfigs = {};
            const scene = director.getScene();
            configs.forEach(config => {
              // Recursively find the target node by name
              const targetNode = this.findNodeByName(scene, config.targetNodeName);
              if (!targetNode) {
                console.warn(`[HotUpdate] Target node '${config.targetNodeName}' not found in scene.`);
              }
              config.targetNode = targetNode;
              this.bundleConfigs[config.bundleName] = config;
            });
            console.log('[HotUpdate] Bundle configs loaded:', this.bundleConfigs);
            // Notify listeners that configs are ready
            this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_READY);
          });
        }

        /**
         * Call this to update and load a specific bundle's content into its target node.
         * @param bundleName The name of the bundle to update and load
         */
        async updateAndLoadBundle(bundleName) {
          const config = this.bundleConfigs[bundleName];
          if (!config) {
            console.error(`[HotUpdate] No config found for bundle: ${bundleName}`);
            return;
          }
          console.log(`[HotUpdate] [${bundleName}] Target node name: ${config.targetNodeName}`);
          // Use recursive search
          const scene = director.getScene();
          const targetNode = this.findNodeByName(scene, config.targetNodeName);
          if (!targetNode) {
            console.error(`[HotUpdate] Target node '${config.targetNodeName}' not found in scene.`);
            return;
          }
          config.targetNode = targetNode;
          if (sys.isNative && this.isJSBInitialized) {
            console.log(`[HotUpdate] Running hot update for bundle: ${bundleName}`);
            await this.runHotUpdate(config);
          } else {
            console.log(`[HotUpdate] Not native platform or JSB not initialized, loading bundle content for: ${bundleName}`);
            await this.loadBundleContent(config);
          }
        }

        /**
         * Call this to update and load multiple bundles at the same time.
         * @param bundleNames Array of bundle names to update and load
         */
        async updateAndLoadBundles(bundleNames) {
          this.pendingUpdates = bundleNames.length;
          this.restartNeeded = false;
          for (const bundleName of bundleNames) {
            await this.updateAndLoadBundle(bundleName);
          }

          // After all updates
          if (this.restartNeeded) {
            if (sys.isNative) {
              // @ts-ignore
              const searchPaths = jsb.fileUtils.getSearchPaths();
              sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
              console.log('[HotUpdate][updateAndLoadBundles] Saved search paths to localStorage:', searchPaths);
            }
            console.log('[HotUpdate][updateAndLoadBundles] All updates done. Restarting game...');
            game.restart();
          } else {
            console.log('[HotUpdate][updateAndLoadBundles] All updates done. No restart needed.');
          }
        }
        async runHotUpdate(config) {
          // Fetch remote version
          const manifestUrl = config.manifestUrl.replace('project.manifest', 'version.manifest');
          let remoteVersion = null;
          try {
            const response = await fetch(manifestUrl);
            const manifest = await response.json();
            remoteVersion = manifest.version;
            console.log(`[HotUpdate][runHotUpdate] Remote version for '${config.bundleName}':`, remoteVersion);
          } catch (e) {
            console.error(`[HotUpdate][runHotUpdate] Failed to fetch remote version for '${config.bundleName}':`, e);
            return;
          }

          // Get local version
          const localVersion = this.getBundleVersion(config.bundleName);

          // Check if update is needed
          if (!localVersion || this.compareVersion(remoteVersion, localVersion) > 0) {
            console.log(`[HotUpdate][runHotUpdate] Update needed for '${config.bundleName}'. Local: ${localVersion}, Remote: ${remoteVersion}`);
            this.runNativeHotUpdate(config, remoteVersion);
          } else {
            console.log(`[HotUpdate][runHotUpdate] No update needed for '${config.bundleName}'. Current version: ${localVersion}`);
            // Load from existing version
            const versionedPath = this.getVersionedBundlePath(config.bundleName, localVersion);
            assetManager.loadBundle(config.bundleName, {
              path: versionedPath
            }, (err, bundle) => {
              if (err) {
                console.error(`[HotUpdate][runHotUpdate] Failed to load bundle '${config.bundleName}' from path:`, versionedPath);
                this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
                this.onUpdateFinished(false, false);
              } else {
                this.loadEntry(bundle, config, false);
              }
            });
          }
        }

        // Helper to get versioned bundle path
        getVersionedBundlePath(bundleName, version) {
          return `${this.storagePath}${bundleName}/${version}/`;
        }

        // Native hot update using jsb.AssetsManager (for native platforms only)
        async runNativeHotUpdate(config, remoteVersion) {
          const storagePath = this.getVersionedBundlePath(config.bundleName, remoteVersion);
          console.log(`[HotUpdate][runNativeHotUpdate] Starting update for '${config.bundleName}' to version ${remoteVersion}`);
          console.log(`[HotUpdate][runNativeHotUpdate] Storage path: ${storagePath}`);

          // Ensure storage directory exists
          if (!jsb.fileUtils.isDirectoryExist(storagePath)) {
            jsb.fileUtils.createDirectory(storagePath);
          }
          const remoteManifestUrl = config.manifestUrl;
          const localManifestPath = storagePath + 'project.manifest';
          console.log(`[HotUpdate][runNativeHotUpdate] Remote Manifest URL: ${remoteManifestUrl}`);
          console.log(`[HotUpdate][runNativeHotUpdate] Local Manifest Path: ${localManifestPath}`);

          // Helper to start the update with a local manifest
          const startUpdate = () => {
            // @ts-ignore
            const assetsManager = new jsb.AssetsManager(localManifestPath, storagePath);
            assetsManager.setVersionCompareHandle((versionA, versionB) => {
              return this.compareVersion(versionA, versionB);
            });
            assetsManager.setEventCallback(event => {
              const code = event.getEventCode();
              const message = event.getMessage();
              console.log(`[HotUpdate][runNativeHotUpdate] Event code: ${code}, Message: ${message}`);
              switch (code) {
                case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                  const percent = event.getPercent();
                  const percentByFile = event.getPercentByFile();
                  console.log(`[HotUpdate][runNativeHotUpdate] Update progress: ${percent}%, File progress: ${percentByFile}%`);
                  break;
                case jsb.EventAssetsManager.UPDATE_FINISHED:
                  console.log('[HotUpdate][runNativeHotUpdate] Update finished successfully');
                  this.updateBundleVersion(config.bundleName, remoteVersion);
                  // Load the bundle from the hot-update path
                  console.log(`[HotUpdate][runNativeHotUpdate] Loading bundle from path: ${storagePath}`);
                  assetManager.loadBundle(config.bundleName, {
                    path: storagePath
                  }, (err, bundle) => {
                    if (err) {
                      console.error('[HotUpdate][runNativeHotUpdate] Failed to load bundle:', err);
                      this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
                      this.onUpdateFinished(false, false);
                    } else {
                      console.log('[HotUpdate][runNativeHotUpdate] Bundle loaded successfully');
                      this.loadEntry(bundle, config, true);
                    }
                  });
                  break;
                case jsb.EventAssetsManager.UPDATE_FAILED:
                  console.error('[HotUpdate][runNativeHotUpdate] Update failed:', message);
                  this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
                  this.onUpdateFinished(false, false);
                  break;
                case jsb.EventAssetsManager.ASSET_UPDATED:
                  console.log('[HotUpdate][runNativeHotUpdate] Asset updated:', message);
                  break;
                case jsb.EventAssetsManager.ERROR_UPDATING:
                  console.error('[HotUpdate][runNativeHotUpdate] Error updating asset:', message);
                  break;
                case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                  console.error('[HotUpdate][runNativeHotUpdate] Error decompressing asset:', message);
                  break;
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                  console.error('[HotUpdate][runNativeHotUpdate] Manifest error:', message);
                  this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
                  this.onUpdateFinished(false, false);
                  break;
              }
            });

            // Start update
            console.log('[HotUpdate][runNativeHotUpdate] Starting update process...');
            assetsManager.update();
          };

          // Download remote manifest if not present locally
          if (!jsb.fileUtils.isFileExist(localManifestPath)) {
            console.log('[HotUpdate][runNativeHotUpdate] Local manifest not found, downloading remote manifest...');
            try {
              const response = await fetch(remoteManifestUrl);
              if (!response.ok) throw new Error('Failed to fetch remote manifest');
              const manifestContent = await response.text();
              const success = jsb.fileUtils.writeStringToFile(manifestContent, localManifestPath);
              if (!success) {
                console.error('[HotUpdate][runNativeHotUpdate] Failed to write manifest to local path:', localManifestPath);
                this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
                this.onUpdateFinished(false, false);
                return;
              }
              console.log('[HotUpdate][runNativeHotUpdate] Remote manifest downloaded and saved locally.');
              startUpdate();
            } catch (err) {
              console.error('[HotUpdate][runNativeHotUpdate] Error downloading remote manifest:', err);
              this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
              this.onUpdateFinished(false, false);
            }
          } else {
            startUpdate();
          }
        }
        async loadBundleContent(config) {
          // Fetch remote version
          const manifestUrl = config.manifestUrl.replace('project.manifest', 'version.manifest');
          let remoteVersion = null;
          try {
            const response = await fetch(manifestUrl);
            const manifest = await response.json();
            remoteVersion = manifest.version;
            console.log(`[HotUpdate][loadBundleContent] Remote version for '${config.bundleName}':`, remoteVersion);
          } catch (e) {
            console.error(`[HotUpdate][loadBundleContent] Failed to fetch remote version for '${config.bundleName}':`, e);
            // fallback: try to load anyway from hot-update path
            const localVersion = this.getBundleVersion(config.bundleName);
            if (localVersion) {
              const versionedPath = this.getVersionedBundlePath(config.bundleName, localVersion);
              assetManager.loadBundle(config.bundleName, {
                path: versionedPath
              }, (err, bundle) => {
                if (err) {
                  console.warn(`[HotUpdate][loadBundleContent] Cached bundle '${config.bundleName}' not found in hot-update path. Skipping.`);
                } else {
                  this.loadEntry(bundle, config, false);
                }
              });
            }
            return;
          }

          // Get local version
          const localVersion = this.getBundleVersion(config.bundleName);

          // Native: Use jsb.AssetsManager for hot update
          if (sys.isNative && (!localVersion || this.compareVersion(remoteVersion, localVersion) > 0)) {
            console.log(`[HotUpdate][loadBundleContent] Native: Remote version is newer. Running native hot update for '${config.bundleName}'.`);
            this.runNativeHotUpdate(config, remoteVersion);
            return;
          }

          // Web or up-to-date: Use assetManager.loadBundle from hot-update path
          if (!localVersion || this.compareVersion(remoteVersion, localVersion) > 0) {
            // For web, fallback to old logic
            console.log(`[HotUpdate][loadBundleContent] Web: Remote version is newer. Using hot-update versioned path and updating bundle '${config.bundleName}'.`);
            this.loadFromRemote(config, remoteVersion);
          } else {
            console.log(`[HotUpdate][loadBundleContent] Local bundle '${config.bundleName}' is up to date.`);
            // Always load from hot-update versioned path
            const versionedPath = this.getVersionedBundlePath(config.bundleName, localVersion);
            assetManager.loadBundle(config.bundleName, {
              path: versionedPath
            }, (err, bundle) => {
              if (err) {
                console.warn(`[HotUpdate][loadBundleContent] Cached bundle '${config.bundleName}' not found in hot-update path. Trying remote...`);
                this.loadFromRemote(config, remoteVersion);
              } else {
                this.loadEntry(bundle, config, false);
              }
            });
          }
        }
        loadFromRemote(config, remoteVersion) {
          // Try loading from remote URL (strip project.manifest from manifestUrl)
          let remoteUrl = config.manifestUrl.replace('project.manifest', '');
          // Remove trailing slash if present
          if (remoteUrl.endsWith('/')) {
            remoteUrl = remoteUrl.slice(0, -1);
          }
          // Always use hot-update versioned path for new version
          const versionedPath = remoteVersion ? this.getVersionedBundlePath(config.bundleName, remoteVersion) : undefined;
          console.log(`[HotUpdate][loadFromRemote] Loading bundle '${config.bundleName}' from remote URL:`, remoteUrl, 'to hot-update path:', versionedPath);
          assetManager.loadBundle(remoteUrl, versionedPath ? {
            path: versionedPath
          } : undefined, (err2, bundle2) => {
            if (err2) {
              console.error(`[HotUpdate][loadFromRemote] Failed to load bundle '${config.bundleName}' from remote:`, err2);
              this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
              this.onUpdateFinished(false, false);
              return;
            }
            console.log(`[HotUpdate][loadFromRemote] Bundle '${config.bundleName}' loaded from remote URL:`, remoteUrl);

            // Update version after successful remote load
            if (remoteVersion) {
              this.updateBundleVersion(config.bundleName, remoteVersion);
            }
            this.loadEntry(bundle2, config, true); // Restart needed after remote update
          });
        }

        loadEntry(bundle, config, needRestart) {
          console.log(`[HotUpdate][loadEntry] [${config.bundleName}] Loading entry file: ${config.entryFile}`);
          bundle.load(config.entryFile, JsonAsset, (err, jsonAsset) => {
            if (err) {
              console.error(`[HotUpdate][loadEntry] [${config.bundleName}] Failed to load entry config:`, err);
              this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
              this.onUpdateFinished(false, false);
              return;
            }
            const entry = jsonAsset.json;
            console.log(`[HotUpdate][loadEntry] [${config.bundleName}] Entry config loaded:`, entry);
            bundle.load(entry.mainPrefab, Prefab, (err, prefab) => {
              if (err) {
                console.error(`[HotUpdate][loadEntry] [${config.bundleName}] Failed to load main prefab:`, err);
                this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
                this.onUpdateFinished(false, false);
                return;
              }
              if (!config.targetNode) {
                console.error(`[HotUpdate][loadEntry] [${config.bundleName}] Target node not found for replacement.`);
                this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, config.bundleName);
                this.onUpdateFinished(false, false);
                return;
              }

              // Preserve the active state of the node being replaced
              const wasActive = config.targetNode.active;
              const parent = config.targetNode.parent;
              const siblingIndex = config.targetNode.getSiblingIndex();

              // If the node is inactive, activate it before replacement
              if (!wasActive) {
                config.targetNode.active = true;
              }
              config.targetNode.destroy();

              // Instantiate as active
              const node = instantiate(prefab);
              node.name = config.targetNodeName;
              node.parent = parent;
              parent.insertChild(node, siblingIndex);

              // Restore the intended active state
              node.active = wasActive;
              console.log(`[HotUpdate][loadEntry] [${config.bundleName}] Replaced node '${config.targetNodeName}' with new prefab.`);
              this.eventTarget.emit(CentralizedHotUpdateManager.EVENT_UPDATE_COMPLETE, config.bundleName);
              this.onUpdateFinished(true, needRestart);
            });
          });
        }

        /**
         * Clears the cache for a specific bundle
         * @param bundleName The name of the bundle to clear cache for
         */
        clearCache(bundleName) {
          this.clearBundleCache(bundleName);
          delete this.bundleVersions[bundleName];
          this.saveBundleVersions();
          console.log(`[HotUpdate][clearCache] Cleared version info for bundle '${bundleName}'.`);
        }

        /**
         * Clears the cache for all bundles
         */
        clearAllCache() {
          if (sys.isNative) {
            if (jsb.fileUtils.isDirectoryExist(this.storagePath)) {
              jsb.fileUtils.removeDirectory(this.storagePath);
              jsb.fileUtils.createDirectory(this.storagePath);
              console.log('[HotUpdate][clearAllCache] Cleared all bundle caches at:', this.storagePath);
            }
          }
          this.bundleVersions = {};
          this.saveBundleVersions();
          console.log('[HotUpdate][clearAllCache] Cleared all bundle version info.');
        }

        /**
         * Check if a bundle needs to be updated based on cache age
         * @param bundleName The name of the bundle to check
         * @param maxAgeInHours Maximum age of cache in hours before requiring update
         * @returns true if bundle needs update, false if cache is still valid
         */
        needsUpdate(bundleName, maxAgeInHours = 24) {
          const cachedVersion = this.getBundleVersion(bundleName);
          if (!cachedVersion) return true;
          const currentTime = Date.now();
          const maxAgeInMs = maxAgeInHours * 60 * 60 * 1000;
          return currentTime - parseInt(cachedVersion) > maxAgeInMs;
        }

        /**
         * Get the last update time for a bundle
         * @param bundleName The name of the bundle to check
         * @returns Date object of last update, or null if never updated
         */
        getLastUpdateTime(bundleName) {
          const cachedVersion = this.getBundleVersion(bundleName);
          return cachedVersion ? new Date(parseInt(cachedVersion)) : null;
        }
        onDestroy() {
          // Clean up event listeners
          director.off(Director.EVENT_AFTER_SCENE_LAUNCH, this.loadBundleConfigs, this);
        }
        onUpdateFinished(success, needRestart = false) {
          if (needRestart) {
            this.restartNeeded = true;
          }
          this.pendingUpdates--;
          // No restart or logic here; handled after all updates in updateAndLoadBundles
          if (this.pendingUpdates < 0) this.pendingUpdates = 0; // Safety
          if (success) {
            console.log('[HotUpdate][onUpdateFinished] Bundle update finished. Restart needed:', needRestart);
          } else {
            console.log('[HotUpdate][onUpdateFinished] Bundle update failed.');
          }
        }
        compareVersion(versionA, versionB) {
          // Custom version comparison logic
          // Return > 0 if versionA > versionB
          // Return 0 if versionA == versionB
          // Return < 0 if versionA < versionB
          console.log(`[HotUpdate][compareVersion] Comparing versions: A='${versionA}' vs B='${versionB}'`);
          const parseVersion = version => {
            return version.split('.').map(v => parseInt(v) || 0);
          };
          const vA = parseVersion(versionA);
          const vB = parseVersion(versionB);
          let result = 0;
          for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
            const a = vA[i] || 0;
            const b = vB[i] || 0;
            if (a !== b) {
              result = a - b;
              break;
            }
          }
          console.log(`[HotUpdate][compareVersion] Result: ${result > 0 ? 'A > B' : result < 0 ? 'A < B' : 'A == B'}`);
          return result;
        }
      }, _class2.EVENT_READY = 'hotupdate-ready', _class2.EVENT_UPDATE_COMPLETE = 'hotupdate-complete', _class2.EVENT_UPDATE_FAILED = 'hotupdate-failed', _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HotUpdateSearchPathRestorer.ts", ['cc'], function (exports) {
  var cclegacy, Component, sys, _decorator;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      Component = module.Component;
      sys = module.sys;
      _decorator = module._decorator;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "e9b38/OScJIBppRnkExsvHA", "HotUpdateSearchPathRestorer", undefined);
      const {
        ccclass
      } = _decorator;
      let HotUpdateSearchPathRestorer = exports('HotUpdateSearchPathRestorer', (_dec = ccclass('HotUpdateSearchPathRestorer'), _dec(_class = class HotUpdateSearchPathRestorer extends Component {
        onLoad() {
          console.log('[HotUpdate] Restorer onLoad called');
          if (sys.isNative) {
            const storedPaths = sys.localStorage.getItem('HotUpdateSearchPaths');
            if (storedPaths) {
              // @ts-ignore
              jsb.fileUtils.setSearchPaths(JSON.parse(storedPaths));
              console.log('[HotUpdate] Restored search paths from localStorage:', storedPaths);
            } else {
              console.log('[HotUpdate] No stored search paths found.');
            }
          }
        }
      }) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LoadingScreen.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CentralizedHotUpdateManager.ts'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, Label, Node, _decorator, Component, CentralizedHotUpdateManager;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Label = module.Label;
      Node = module.Node;
      _decorator = module._decorator;
      Component = module.Component;
    }, function (module) {
      CentralizedHotUpdateManager = module.CentralizedHotUpdateManager;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
      cclegacy._RF.push({}, "a91a96CgylFK4u7baYYeCoO", "LoadingScreen", undefined);
      const {
        ccclass,
        property
      } = _decorator;
      let LoadingScreen = exports('LoadingScreen', (_dec = ccclass('LoadingScreen'), _dec2 = property(CentralizedHotUpdateManager), _dec3 = property([String]), _dec4 = property(Label), _dec5 = property(Node), _dec(_class = (_class2 = class LoadingScreen extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "hotUpdateManager", _descriptor, this);
          _initializerDefineProperty(this, "bundles", _descriptor2, this);
          _initializerDefineProperty(this, "loadingLabel", _descriptor3, this);
          _initializerDefineProperty(this, "gameContent", _descriptor4, this);
        }
        // Reference to your GameContent node

        async onLoad() {
          // Show loading text
          if (this.loadingLabel) {
            this.loadingLabel.string = 'Checking for updates...';
          }

          // Hide main game content while loading
          if (this.gameContent) {
            this.gameContent.active = false;
          }

          // Wait for hot update to finish
          await this.hotUpdateManager.updateAndLoadBundles(this.bundles);

          // Optionally update loading text
          if (this.loadingLabel) {
            this.loadingLabel.string = 'Loading complete!';
          }

          // Hide loading screen and show main content
          this.node.active = false;
          if (this.gameContent) {
            this.gameContent.active = true;
          }
        }
      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "hotUpdateManager", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "bundles", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "loadingLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "gameContent", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./CentralizedHotUpdateManager.ts', './HotUpdateSearchPathRestorer.ts', './LoadingScreen.ts', './Navigation.ts'], function () {
  return {
    setters: [null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/Navigation.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CentralizedHotUpdateManager.ts'], function (exports) {
  var _applyDecoratedDescriptor, _initializerDefineProperty, cclegacy, _decorator, Component, find, CentralizedHotUpdateManager;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _initializerDefineProperty = module.initializerDefineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Component = module.Component;
      find = module.find;
    }, function (module) {
      CentralizedHotUpdateManager = module.CentralizedHotUpdateManager;
    }],
    execute: function () {
      var _dec, _dec2, _class, _class2, _descriptor;
      cclegacy._RF.push({}, "5b8b8Xojr5JZKSpNWptjfWm", "Navigation", undefined);
      const {
        ccclass,
        property
      } = _decorator;
      let Navigation = exports('Navigation', (_dec = ccclass('Navigation'), _dec2 = property(CentralizedHotUpdateManager), _dec(_class = (_class2 = class Navigation extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "hotUpdateManager", _descriptor, this);
          this.BUNDLES = ['mainscreen', 'helloworld', 'event'];
          this.UPDATE_CHECK_INTERVAL = 12;
        }
        // Check for updates every 12 hours

        onLoad() {
          // Always set MainScreen active and EventsScreen inactive at startup
          const mainScreen = find('Canvas/GameContent/MainScreen');
          const eventsScreen = find('Canvas/GameContent/EventsScreen');
          if (mainScreen) mainScreen.active = true;
          if (eventsScreen) eventsScreen.active = false;

          // Listen for hot update manager events
          this.hotUpdateManager.eventTarget.on(CentralizedHotUpdateManager.EVENT_READY, this.onHotUpdateReady, this);
          this.hotUpdateManager.eventTarget.on(CentralizedHotUpdateManager.EVENT_UPDATE_COMPLETE, this.onBundleUpdateComplete, this);
          this.hotUpdateManager.eventTarget.on(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, this.onBundleUpdateFailed, this);

          // Check for updates immediately when game opens
          this.checkForUpdates();
        }
        checkForUpdates() {
          // Check which bundles need updating
          const bundlesToUpdate = this.BUNDLES.filter(bundleName => this.hotUpdateManager.needsUpdate(bundleName, this.UPDATE_CHECK_INTERVAL));
          if (bundlesToUpdate.length > 0) {
            console.log(`[Navigation] Bundles need updating: ${bundlesToUpdate.join(', ')}`);
            // Update only the bundles that need updating
            this.hotUpdateManager.updateAndLoadBundles(bundlesToUpdate);
          } else {
            console.log('[Navigation] All bundles are up to date');
            // Load all bundles since they're up to date
            this.hotUpdateManager.updateAndLoadBundles(this.BUNDLES);
          }
        }
        onHotUpdateReady() {
          // Check for updates again when hot update manager is ready
          this.checkForUpdates();
        }
        onBundleUpdateComplete(bundleName) {
          console.log(`[Navigation] Bundle '${bundleName}' updated successfully`);
          const lastUpdate = this.hotUpdateManager.getLastUpdateTime(bundleName);
          if (lastUpdate) {
            console.log(`[Navigation] Last update time: ${lastUpdate.toLocaleString()}`);
          }
        }
        onBundleUpdateFailed(bundleName) {
          console.error(`[Navigation] Failed to update bundle '${bundleName}'`);
          // You might want to show an error message to the user here
        }

        onGoToEvents() {
          const mainScreen = find('Canvas/GameContent/MainScreen');
          const eventsScreen = find('Canvas/GameContent/EventsScreen');
          if (mainScreen) mainScreen.active = false;
          if (eventsScreen) eventsScreen.active = true;
        }
        onBackToMain() {
          const mainScreen = find('Canvas/GameContent/MainScreen');
          const eventsScreen = find('Canvas/GameContent/EventsScreen');
          if (mainScreen) mainScreen.active = true;
          if (eventsScreen) eventsScreen.active = false;
        }
        onDestroy() {
          // Clean up event listeners
          if (this.hotUpdateManager) {
            this.hotUpdateManager.eventTarget.off(CentralizedHotUpdateManager.EVENT_READY, this.onHotUpdateReady, this);
            this.hotUpdateManager.eventTarget.off(CentralizedHotUpdateManager.EVENT_UPDATE_COMPLETE, this.onBundleUpdateComplete, this);
            this.hotUpdateManager.eventTarget.off(CentralizedHotUpdateManager.EVENT_UPDATE_FAILED, this.onBundleUpdateFailed, this);
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "hotUpdateManager", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});