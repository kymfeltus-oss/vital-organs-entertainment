"use client";

import ExploreHeader from "@/app/enterprise/coleman/components/explore/ExploreHeader";
import ExploreMediaBar from "@/app/enterprise/coleman/components/explore/ExploreMediaBar";
import ExploreMetronomeCard from "@/app/enterprise/coleman/components/explore/ExploreMetronomeCard";
import ExploreSidebar from "@/app/enterprise/coleman/components/explore/ExploreSidebar";
import ExploreDarkTheoryCard from "@/app/enterprise/coleman/components/explore/ExploreDarkTheoryCard";
import ExploreDarkTunerCard from "@/app/enterprise/coleman/components/explore/ExploreDarkTunerCard";
import { ExploreStudioProvider } from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";

export default function ColemanExploreStudio() {
  return (
    <ExploreStudioProvider>
      <div className="coleman-explore-studio">
        <ExploreHeader />

        <div className="exo-workspace">
          <ExploreSidebar />

          <div className="exo-main">
            <div className="exo-scroll">
              <ExploreMetronomeCard />
              <ExploreDarkTunerCard />
              <ExploreDarkTheoryCard />
            </div>
          </div>
        </div>

        <ExploreMediaBar />
      </div>
    </ExploreStudioProvider>
  );
}
