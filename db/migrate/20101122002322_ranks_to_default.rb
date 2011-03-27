class RanksToDefault < ActiveRecord::Migration
  def self.up
    User.all.each do |user|
        user.rank = 0
        user.save
    end
    u = User.find(1)
    u.rank = 5
    u.save
  end

  def self.down
  end
end
