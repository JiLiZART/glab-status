import colors from "picocolors";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"; // ES 2015

dayjs.extend(relativeTime);

export class Display {
  rows: string[] = [];
  constructor(...args: unknown[]) {
    const rows = args[0];

    if (rows instanceof Display) {
      (args as Display[]).forEach((display) => display.display());
    } else if (Array.isArray(rows)) {
      this.rows = rows;
    }
  }

  display() {
    this.rows.forEach((row) => console.log(row));
  }
}

export class DisplayEnvironment extends Display {
  constructor(environment: { external_url: string }) {
    super([
      colors.bold("Environment"),
      `> ${colors.blue(environment.external_url)}`,
      "",
    ]);
  }
}

export class DisplayMergeRequest extends Display {
  constructor(mr: {
    merged_at: string;
    state: string;
    title: string;
    iid: string;
    web_url: string;
  }) {
    const mrid = colors.red(`#${mr.iid}`);
    const date = colors.green(`(${dayjs(mr.merged_at).fromNow()})`);
    const statusEmojis = {
      opened: colors.greenBright("✅ Opened"),
      closed: colors.redBright("❌ Closed"),
      merged: colors.greenBright("✅ Merged"),
    } as Record<string, string>;

    const status = statusEmojis[mr.state] || "";

    super([
      colors.bold("Merge Request"),
      `${mrid} - ${mr.title} - ${status} ${date}`,
      `> ${colors.blue(mr.web_url)}`,
      "",
    ]);
  }
}

export class DisplayCommit extends Display {
  static statusEmojis = {
    created: colors.whiteBright("⚙️ Created"),
    waiting_for_resource: colors.yellowBright("⏳ Waiting for resource"),
    preparing: colors.yellowBright("🔄 Preparing"),
    pending: colors.yellowBright("💤 Pending"),
    running: colors.whiteBright("🚀 Running"),
    success: colors.greenBright("✅ Success"),
    failed: colors.redBright("❌ Failed"),
    canceled: colors.redBright("🛑 Canceled"),
    skipped: colors.yellowBright("⏭️ Skipped"),
    manual: colors.blueBright("👤 Manual"),
    scheduled: colors.blueBright("📅 Scheduled"),
  } as Record<string, string>;

  constructor(
    commit: {
      created_at: string;
      short_id: string;
      title: string;
      author_name: string;
    },
    pipeline: { status: string; web_url: string }
  ) {
    const sha = colors.red(`${commit.short_id}`);
    const author = colors.blueBright(`<${commit.author_name}>`);
    const date = colors.green(`(${dayjs(commit.created_at).fromNow()})`);
    const title = colors.whiteBright(commit.title);

    super([
      colors.bold("Commit"),
      `${sha} - ${title} ${date} ${author} - ${
        DisplayCommit.statusEmojis[pipeline.status]
      }`,
      `> ${colors.blue(pipeline.web_url)}`,
      "",
    ]);
  }
}

type PipelineJob = {
  status: string;
  stage: string;
  duration: number;
  name: string;
};

export class DisplayPipelineJobs extends Display {
  static statusMap = {
    success: "🟢",
    failed: "🔴",
    canceled: "🟠",
    skipped: "🟡",
    pending: "🟣",
    running: "🔵",
    created: "⚪",
  } as Record<string, string>;

  constructor(pipelineJobs: PipelineJob[] = []) {
    const stages = pipelineJobs
      .filter((item) => item.status !== "manual")
      .reduce((acc, item) => {
        const items = (acc[item.stage] = acc[item.stage] || []);
        items.push(item);
        return acc;
      }, {} as Record<string, PipelineJob[]>);

    super(
      Object.entries(stages)
        .map(([stage, stages]) => {
          return [
            colors.bold(stage),
            stages
              .map((stage) => {
                const secs = colors.gray(`(${Math.round(stage.duration)}s)`);
                const status =
                  DisplayPipelineJobs.statusMap[stage.status] ||
                  stage.status ||
                  "";

                return String(`${status} ${stage.name} ${secs}`).trim();
              })
              .join(" "),
            "",
          ].flat();
        })
        .flat()
    );
  }
}
