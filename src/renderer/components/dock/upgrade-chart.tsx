/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import React from "react";
import { computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import type { TabId } from "./dock.store";
import { TabKind } from "./dock.store";
import { InfoPanel, InfoPanelProps } from "./info-panel";
import { Badge } from "../badge";
import type { IChartVersion } from "../+apps-helm-charts/helm-chart.store";
import type { HelmRelease } from "../../../common/k8s-api/endpoints/helm-releases.api";
import { Select, SelectOption } from "../select";
import { upgradeChartStore } from "./upgrade-chart.store";
import { dockViewsManager } from "./dock.views-manager";

interface Props extends InfoPanelProps {
}

@observer
export class UpgradeChartInfoPanel extends React.Component<Props> {
  @observable selectedVersion: IChartVersion;

  constructor(props: Props) {
    super(props);
    makeObservable(this);
  }

  get tabId(): TabId {
    return this.props.tabId;
  }

  get release(): HelmRelease {
    return upgradeChartStore.getRelease(this.tabId);
  }

  @computed get chartVersions(): SelectOption<IChartVersion>[] {
    const chartName = this.release.getChart();
    const versions = upgradeChartStore.versions.get(this.tabId) ?? [];

    return versions.map(value => ({
      label: `${value.repo}/${chartName}-${value.version}`,
      value,
    }));
  }

  upgrade = async () => {
    await upgradeChartStore.upgrade(this.tabId, this.selectedVersion);

    return (
      <p>
        Release <b>{this.release.getName()}</b> successfully upgraded to version <b>{this.selectedVersion.version}</b>
      </p>
    );
  };

  render() {
    if (!upgradeChartStore.isReady(this.tabId)) {
      return null;
    }

    const { release, selectedVersion, chartVersions } = this;

    return (
      <InfoPanel
        {...this.props}
        submit={this.upgrade}
        submitLabel="Upgrade"
        submittingMessage="Updating.."
        controls={
          <div className="upgrade flex gaps align-center">
            <span>Release</span> <Badge label={release.getName()}/>
            <span>Namespace</span> <Badge label={release.getNs()}/>
            <span>Version</span> <Badge label={release.getVersion()}/>
            <span>Upgrade version</span>
            <Select
              className="chart-version"
              menuPlacement="top"
              themeName="outlined"
              value={selectedVersion}
              options={chartVersions}
              onChange={({ value }: SelectOption<IChartVersion>) => this.selectedVersion = value}
            />
          </div>
        }
      />
    );
  }
}

dockViewsManager.register(TabKind.UPGRADE_CHART, {
  InfoPanel: UpgradeChartInfoPanel,
  editor: {
    getValue(tabId): string {
      return upgradeChartStore.values.get(tabId);
    },
    setValue(tabId, value) {
      upgradeChartStore.values.set(tabId, value);
    },
  }
});
